import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, ChatMessage } from '../types';
// FIX: Removed 'LiveSession' as it is not an exported member of '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Chat } from "@google/genai";
import { startChat, encode, decode, decodeAudioData } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import { MathRenderer } from './MathRenderer';


if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


interface StudentAITutorProps {
    // student prop is now sourced from context
}

export const StudentAITutor: React.FC<StudentAITutorProps> = () => {
    const { currentUser: student, backToDashboard } = useAppContext();
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const chatRef = useRef<Chat | null>(null);
    // FIX: Used ReturnType to infer the type of the session promise from the SDK, as LiveSession is not exported.
    const sessionPromiseRef = useRef<ReturnType<typeof ai.live.connect> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    // Refs for streaming transcription
    const currentInputMsgIdRef = useRef<string | null>(null);
    const currentOutputMsgIdRef = useRef<string | null>(null);
    const currentInputTextRef = useRef('');
    const currentOutputTextRef = useRef('');

    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    const cleanup = useCallback(() => {
        setIsRecording(false);
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (processorRef.current) processorRef.current.disconnect();
        if (sessionPromiseRef.current) sessionPromiseRef.current.then(s => s.close());
        for (const source of sourcesRef.current.values()) source.stop();
        sourcesRef.current.clear();
        sessionPromiseRef.current = null;
        streamRef.current = null;
        processorRef.current = null;
        nextStartTimeRef.current = 0;
    }, []);

    useEffect(() => {
        setHistory([]);
        return () => cleanup();
    }, [mode, cleanup]);


    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: userInput.trim() };
        setHistory(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        const thinkingMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'model', text: '', isThinking: true };
        setHistory(prev => [...prev, thinkingMessage]);

        try {
            if (!chatRef.current) chatRef.current = startChat();
            const response = await chatRef.current.sendMessage({ message: userMessage.text });
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            const sources = groundingChunks?.map((chunk: any) => ({
                title: chunk.web?.title || 'Source',
                uri: chunk.web?.uri || '#',
            })).filter((s: any) => s.uri !== '#');

            const modelMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'model', text: response.text, sources };
            setHistory(prev => prev.slice(0, -1).concat(modelMessage));
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'system', text: 'Sorry, I encountered an error. Please try again.' };
            setHistory(prev => prev.slice(0, -1).concat(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const toggleRecording = async () => {
        if (isRecording) {
            cleanup();
            return;
        }
        
        // Browser Feature Checks
        if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext || !(window.AudioContext || (window as any).webkitAudioContext)) {
             setHistory(prev => [...prev, { id: crypto.randomUUID(), sender: 'system', text: 'Voice chat is not supported by your browser or connection.' }]);
            return;
        }
        
        setIsRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AudioC = window.AudioContext || (window as any).webkitAudioContext;
            const inputContext = new AudioC({ sampleRate: 16000 });
            audioContextRef.current = inputContext;
            const outputContext = new AudioC({ sampleRate: 24000 });
            outputAudioContextRef.current = outputContext;
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are a friendly AI Tutor for ${student?.name}. Keep responses concise. Use LaTeX for math.`
                },
                callbacks: {
                    onopen: () => {
                        setHistory(prev => [...prev, {id: crypto.randomUUID(), sender: 'system', text: 'Connection opened. You can start speaking.'}]);
                        const source = inputContext.createMediaStreamSource(stream);
                        const processor = inputContext.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = { data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(processor);
                        processor.connect(inputContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Streaming transcription logic...
                        if (message.serverContent?.inputTranscription) {
                            currentInputTextRef.current += message.serverContent.inputTranscription.text;
                            setHistory(prev => {
                                if (!currentInputMsgIdRef.current) {
                                    const newId = crypto.randomUUID();
                                    currentInputMsgIdRef.current = newId;
                                    return [...prev, { id: newId, sender: 'user', text: currentInputTextRef.current, isInProgress: true }];
                                }
                                return prev.map(msg => msg.id === currentInputMsgIdRef.current ? { ...msg, text: currentInputTextRef.current } : msg);
                            });
                        }

                        if (message.serverContent?.outputTranscription) {
                            currentOutputTextRef.current += message.serverContent.outputTranscription.text;
                             setHistory(prev => {
                                if (!currentOutputMsgIdRef.current) {
                                    const newId = crypto.randomUUID();
                                    currentOutputMsgIdRef.current = newId;
                                    return [...prev, { id: newId, sender: 'model', text: currentOutputTextRef.current, isInProgress: true }];
                                }
                                return prev.map(msg => msg.id === currentOutputMsgIdRef.current ? { ...msg, text: currentOutputTextRef.current } : msg);
                            });
                        }

                        if (message.serverContent?.turnComplete) {
                            setHistory(prev => prev.map(msg => (msg.id === currentInputMsgIdRef.current || msg.id === currentOutputMsgIdRef.current) ? { ...msg, isInProgress: false } : msg));
                            currentInputMsgIdRef.current = null;
                            currentOutputMsgIdRef.current = null;
                            currentInputTextRef.current = '';
                            currentOutputTextRef.current = '';
                        }
                        
                        // Audio playback
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            const outCtx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outCtx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onclose: () => { setHistory(p => [...p, { id: crypto.randomUUID(), sender: 'system', text: 'Connection closed.' }]); cleanup(); },
                    onerror: (e) => { console.error(e); setHistory(p => [...p, { id: crypto.randomUUID(), sender: 'system', text: 'An error occurred.' }]); cleanup(); },
                },
            });
        } catch (error) {
            console.error("Error starting voice session:", error);
            setHistory([{ id: crypto.randomUUID(), sender: 'system', text: 'Could not start voice session. Please grant microphone permissions.' }]);
            setIsRecording(false);
        }
    };

    return (
        <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col">
            <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={backToDashboard} className="p-2 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                    <h2 className="text-xl font-bold text-slate-800">AI Tutor</h2>
                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setMode('text')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'text' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>Text</button>
                    <button onClick={() => setMode('voice')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mode === 'voice' ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>Voice</button>
                </div>
            </header>
            
            <div ref={historyRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {history.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0"></div>}
                        <div className={`max-w-xl p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : msg.sender === 'model' ? 'bg-slate-100 text-slate-800 rounded-bl-none' : 'bg-transparent text-slate-500 text-center w-full text-sm italic'} ${msg.isInProgress ? 'opacity-70' : ''}`}>
                            {msg.isThinking ? <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div> : <div className="prose prose-sm max-w-none"><MathRenderer text={msg.text} /></div>}
                             {msg.sources && <div className="mt-4 pt-3 border-t border-slate-200/50"><h4 className="font-semibold text-xs mb-2 text-indigo-200">Sources:</h4><div className="flex flex-col gap-2">{msg.sources.map((s, i) => <a href={s.uri} target="_blank" rel="noopener noreferrer" key={i} className="text-xs text-indigo-100 bg-white/10 p-2 rounded-md hover:bg-white/20 truncate">{i+1}. {s.title}</a>)}</div></div>}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="p-4 border-t border-slate-200">
                {mode === 'text' ? (
                    <form onSubmit={handleTextSubmit} className="flex items-center gap-3">
                        <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type your question here..." disabled={isLoading} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"/>
                        <button type="submit" disabled={!userInput.trim() || isLoading} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300">Send</button>
                    </form>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                         <button onClick={toggleRecording} className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </button>
                        <p className="text-sm text-slate-500">{isRecording ? "Listening... Click to stop." : "Click to start speaking"}</p>
                    </div>
                )}
            </footer>
        </div>
    );
};