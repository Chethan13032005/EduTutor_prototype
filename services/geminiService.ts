
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { Quiz, UserAnswers, InputContext, StoredQuiz, StoredSubmission, QuizConfig } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MATH_FORMATTING_RULES = `
FORMATTING RULES:
1. EXPONENTS/SUBSCRIPTS: Use Unicode (x², x³, H₂O, v₀). NO caret (^) symbols.
2. SYMBOLS: Use real math symbols: ×, ÷, π, θ, √, →, ∞, ≈, ≠, ≤, ≥, ±.
3. FRACTIONS: Use one-line style like (a+b)/c or 1/2.
4. SCIENTIFIC NOTATION: Use multiplication sign and superscript: 3.0 × 10⁸.
5. CLEAN TEXT: Do NOT use LaTeX ($$), markdown code blocks, or bold/italic styling in JSON strings.
`;

const quizGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A creative, short, and relevant title for the quiz based on the content." },
        mcqs: {
            type: Type.ARRAY,
            description: "An array of multiple-choice questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The question text. Use clean Unicode math symbols (e.g., x², √x)." },
                    options: {
                        type: Type.ARRAY,
                        description: "An array of possible answers. Use clean Unicode math.",
                        items: { type: Type.STRING }
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "The index (0-based) of the correct option in the options array." },
                    explanation: { type: Type.STRING, description: "Explanation of why the correct answer is right." }
                },
                required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
            },
        },
        shortAnswerQuestions: {
            type: Type.ARRAY,
            description: "An array of short-answer questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: "The question text. Use clean Unicode math symbols." },
                    modelAnswer: { type: Type.STRING, description: "A sample correct answer or key points to look for." },
                    explanation: { type: Type.STRING, description: "Explanation of the core concept." }
                },
                required: ['question', 'modelAnswer', 'explanation'],
            },
        },
    },
    required: ['title', 'mcqs', 'shortAnswerQuestions'],
};

const gradingSchema = {
    type: Type.OBJECT,
    properties: {
        mcqResults: {
            type: Type.ARRAY,
            description: "Grading results for each multiple-choice question.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "The original question ID." },
                    isCorrect: { type: Type.BOOLEAN, description: "Whether the user's answer was correct." },
                    correctAnswerIndex: { type: Type.INTEGER, description: "The index of the correct option." },
                    feedback: { type: Type.STRING, description: "Clear, plain text reasoning. Use Unicode math symbols." },
                },
                required: ['id', 'isCorrect', 'correctAnswerIndex', 'feedback'],
            },
        },
        shortAnswerResults: {
            type: Type.ARRAY,
            description: "Grading results for each short-answer question.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "The original question ID." },
                    feedback: { type: Type.STRING, description: "Constructive plain text feedback. Use Unicode math symbols." },
                    score: { type: Type.INTEGER, description: "Score out of 5 for the answer." },
                },
                required: ['id', 'feedback', 'score'],
            },
        },
        overallFeedback: { type: Type.STRING, description: "Overall constructive feedback." },
        scorePercentage: { type: Type.NUMBER, description: "The final overall score as a percentage." },
        strengths: {
            type: Type.ARRAY,
            description: "A list of 2-3 specific concepts or topics the student demonstrated good understanding of.",
            items: { type: Type.STRING }
        },
        topicsToStudy: {
            type: Type.ARRAY,
            description: "A list of 2-3 specific topics or concepts the student should review based on their incorrect answers.",
            items: { type: Type.STRING }
        },
        studyPlan: {
            type: Type.ARRAY,
            description: "A list of exactly 3 specific, actionable study instructions. Start with a verb (e.g., 'Review', 'Practice', 'Memorize').",
            items: { type: Type.STRING }
        }
    },
    required: ['mcqResults', 'shortAnswerResults', 'overallFeedback', 'scorePercentage', 'strengths', 'topicsToStudy', 'studyPlan'],
};

const adminAnalyticsSchema = {
    type: Type.OBJECT,
    properties: {
        keyStrength: { type: Type.STRING, description: "A single, concise sentence identifying the strongest performing area or topic." },
        keyWeakness: { type: Type.STRING, description: "A single, concise sentence identifying the weakest performing area or topic." },
        observedTrend: { type: Type.STRING, description: "A single, concise sentence describing a notable trend." },
        recommendation: { type: Type.STRING, description: "A single, actionable recommendation for institutional improvement based on the data." },
    },
    required: ['keyStrength', 'keyWeakness', 'observedTrend', 'recommendation']
};

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

const fileToText = (file: File): Promise<string> => {
    return file.text();
};

export const generateQuiz = async (context: InputContext, config: QuizConfig): Promise<Quiz> => {
    let contents: any;

    if (config.mcqCount === 0 && config.shortAnswerCount === 0) {
        throw new Error("Cannot generate a quiz with 0 questions.");
    }

    let titleInstruction = "Generate a creative, short, and relevant title for this quiz.";
    if (config.title && config.title.trim() !== "") {
        titleInstruction = `Use the exact title: "${config.title.trim()}"`;
    }

    let promptCore = `You are an autonomous AI teaching agent specializing in mathematics and scientific education. Your task is to create a quiz.
${MATH_FORMATTING_RULES}

${titleInstruction}
The quiz must have a difficulty level of '${config.difficulty}'.
It must contain exactly ${config.mcqCount} multiple-choice questions and ${config.shortAnswerCount} short-answer questions.
Each multiple-choice question must have exactly ${config.mcqChoices} distinct options.
The questions should be clear, challenging, and directly relevant to the provided context.
You MUST include the Correct Answer Index and a detailed Explanation for every question for the teacher's reference.
Adhere strictly to the provided JSON schema.`;

    switch (context.type) {
        case 'topic':
            contents = `${promptCore}\n\nContext Topic: "${context.content}"`;
            break;
        case 'text':
             contents = `${promptCore}\n\nContext Text:\n---\n${context.content}\n---`;
            break;
        case 'document':
             // Handle Documents (PDF, CSV, HTML, etc.) natively using Gemini's multimodal capabilities
             const file = context.content as File;
             if (file.type === 'text/plain') {
                 // For plain text files, we can just read the text to save tokens/processing
                 const docText = await fileToText(file);
                 contents = `${promptCore}\n\nContext Document Content:\n---\n${docText}\n---`;
             } else {
                 // For PDFs, CSVs, etc., send the file binary
                 const docPart = await fileToGenerativePart(file);
                 contents = { parts: [{text: promptCore}, docPart] };
             }
            break;
        case 'image':
            const imagePart = await fileToGenerativePart(context.content as File);
            const imagePrompt = `${promptCore}\n\nContext: Analyze the provided image.`;
            contents = { parts: [{text: imagePrompt}, imagePart] };
            break;
        default:
            throw new Error("Unsupported input type for quiz generation.");
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: quizGenerationSchema,
            },
        });

        const quizData = JSON.parse(response.text);

        const quizWithIds: Quiz = {
            title: quizData.title,
            mcqs: quizData.mcqs ? quizData.mcqs.map((q: any) => ({ ...q, id: crypto.randomUUID() })) : [],
            shortAnswerQuestions: quizData.shortAnswerQuestions ? quizData.shortAnswerQuestions.map((q: any) => ({ ...q, id: crypto.randomUUID() })) : [],
        };

        return quizWithIds;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("The Curriculum Agent failed to generate a quiz. The provided content might be too restrictive or the AI service is currently unavailable.");
    }
};

export const gradeQuiz = async (quiz: Quiz, answers: UserAnswers) => {
    // Note: We pass the quiz structure which now contains correct answers, but we still rely on the AI grader 
    // to evaluate short answers and provide nuance.
    const questionsAndAnswers = {
        mcqs: quiz.mcqs.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options,
            userAnswerIndex: answers[q.id],
        })),
        shortAnswerQuestions: quiz.shortAnswerQuestions.map(q => ({
            id: q.id,
            question: q.question,
            userAnswer: answers[q.id],
        }))
    };

    const prompt = `You are an expert AI grading agent, specializing in mathematics and science. Please grade the following quiz based on the student's answers.
    ${MATH_FORMATTING_RULES}

    Quiz and Answers:
    \`\`\`json
    ${JSON.stringify(questionsAndAnswers, null, 2)}
    \`\`\`

    Your task:
    1.  For each MCQ, determine if the answer is correct. Provide the correct answer's index and a brief, clear explanation.
    2.  For each short-answer question, evaluate the response, provide constructive feedback, and assign a score from 0 to 5.
    3.  Calculate an overall score percentage.
    4.  Write encouraging overall feedback.
    5.  Identify 2-3 "Strengths" (topics the student knows well).
    6.  Identify 2-3 "Topics to Study" (topics the student missed).
    7.  Create a 'Study Plan' with 3 specific, actionable tips.
    8.  Return your complete evaluation in JSON format, adhering to the schema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: gradingSchema,
            },
        });
        
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Error grading quiz:", error);
        throw new Error("The Grading Agent failed to grade the quiz. The answers might be malformed or the AI service is currently unavailable.");
    }
};

export const getAdminAnalytics = async (quizzes: StoredQuiz[], submissions: StoredSubmission[]): Promise<{ report: string[] }> => {
    const analyticsData = {
        totalQuizzes: quizzes.length,
        totalSubmissions: submissions.length,
        averageScores: quizzes.map(quiz => {
            const quizSubmissions = submissions.filter(s => s.quizId === quiz.id);
            if (quizSubmissions.length === 0) return null;
            const avg = quizSubmissions.reduce((acc, s) => acc + s.results.scorePercentage, 0) / quizSubmissions.length;
            return { quizId: quiz.id, averageScore: avg.toFixed(1) };
        }).filter(Boolean),
        studentPerformance: submissions.map(s => ({
            studentName: s.studentName,
            quizId: s.quizId,
            score: s.results.scorePercentage
        }))
    };

    const prompt = `You are a premier educational data analysis agent. Analyze the provided JSON data to generate a sophisticated institutional performance report.
    Your task is to generate exactly four key analytical insights.
    ${MATH_FORMATTING_RULES}
    Your entire response MUST be a JSON object that adheres to the provided schema.

    Data:
    \`\`\`json
    ${JSON.stringify(analyticsData, null, 2)}
    \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adminAnalyticsSchema,
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });

        const result = JSON.parse(response.text);
        const reportPoints = [
            result.keyStrength,
            result.keyWeakness,
            result.observedTrend,
            result.recommendation
        ];
        return { report: reportPoints };
    } catch (error) {
        console.error("Error generating admin analytics:", error);
        throw new Error("The Analytics Agent failed to generate an institutional report.");
    }
};

export const refineQuestionText = async (question: string): Promise<string> => {
    const prompt = `You are an expert curriculum developer. Refine this question for clarity.
    ${MATH_FORMATTING_RULES}
    Return only refined text.
    Original: "${question}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error refining question:", error);
        throw new Error("The AI agent failed to refine the question.");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say this with a friendly and encouraging tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw new Error("The TTS Agent failed to generate audio.");
    }
};

export const startChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash-lite',
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: `You are a friendly and helpful AI Tutor.
${MATH_FORMATTING_RULES}
DO NOT use LaTeX or Markdown code blocks. Output plain text with Unicode symbols.`,
        },
    });
};

export const analyzeContent = async (prompt: string, file: File): Promise<string> => {
    const textPart = { text: `${prompt}. ${MATH_FORMATTING_RULES}` };
    const filePart = await fileToGenerativePart(file);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [textPart, filePart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing content:", error);
        throw new Error("The AI agent failed to analyze the content.");
    }
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
