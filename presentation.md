# EduTutor Agent (QuizMind) - Presentation

---

## 🧩 Slide 1 – Title Slide

**Title:**
EduTutor Agent (QuizMind)
*Autonomous Quiz Creator & Grader*

**Subtitle:**
An AI-Driven Platform for Smart Assessment, Grading & Personalized Feedback

**Presented By:** Chethan A.
**Institution:** Bapuji Institute of Engineering & Technology (BIET)
**Department:** Computer Science and Engineering

---

## 🧩 Slide 2 – Introduction

- EduTutor Agent (QuizMind) is an AI-powered educational assistant that automates the entire quiz lifecycle.
- It generates high-quality MCQs & short-answer questions, grades responses instantly, and provides personalized reasoning-based feedback.
- The system empowers teachers to focus on teaching and helps students learn faster through adaptive feedback loops.
- It integrates specialized AI functions, powered by the Google Gemini API, that act as a digital co-teacher.

---

## 🧩 Slide 3 – Objectives

- Automate quiz generation from teacher-uploaded text, documents, or images.
- Enable instant grading and feedback using AI reasoning and LaTeX for math.
- Provide role-based dashboards for teachers, students, and admins.
- Deliver adaptive learning recommendations and real-time tutoring.
- Support human–AI collaboration to improve question clarity & grading accuracy.

---

## 🧩 Slide 4 – Problem Statement

Manual quiz creation & grading are time-consuming, inconsistent, and fail to give students timely feedback.
There is a critical need for a system that:

- Generates reliable, relevant questions automatically.
- Grades diverse answer types accurately.
- Provides reasoning-based feedback & learning suggestions instantly.

EduTutor Agent addresses these pain points with autonomous AI functions.

---

## 🧩 Slide 5 – Literature Survey

Our project is built upon key findings from recent academic research:

- From **Karvinen (2023)** and **Goyal et al. (2024)**, we adopted the core concept of using advanced transformer models (like Gemini) to reliably generate quiz questions from course material.
- The RAG (Retrieval-Augmented Generation) approach from **Hang et al. (2024)** and **Pradeesh N. et al. (2025)** inspired our Student Tutor's use of Google Search grounding to provide accurate, up-to-date answers.
- From **Aggarwal et al. (2025)**, we confirmed the importance of our Grading Agent's primary function: to provide not just a score, but rich, reasoning-based feedback that enhances student understanding.
- The work of **Moore (2024)** and **Kang et al. (2025)** heavily influenced our human-in-the-loop design, leading to the "Review & Refine with AI" feature that empowers teachers to collaborate with the AI.
- The focus on subjective, short-answer assessment in **Das et al. (2022)** validated our inclusion of short-answer questions to test critical thinking beyond simple MCQs.

---

## 🧩 Slide 6 – Drawbacks of Existing Systems

The literature revealed several gaps which EduTutor Agent aims to fill:

- **Siloed Functionality:** Most systems focus on a single task (e.g., only question generation or only grading). Our platform integrates the entire lifecycle from creation to tutoring.
- **Limited Modality:** Research often focuses on text-only inputs. Our system is multi-modal, generating quizzes from text, topics, images, and documents.
- **Lack of Real-Time Interaction:** The surveyed systems lack a live, conversational tutoring component. We implemented a dual-mode AI tutor with both text and real-time voice chat via the Gemini Live API.
- **Single-Model Approach:** Many papers use one general-purpose model. We use a suite of specialized Gemini models (Pro, Flash, Flash-Lite, Native Audio, TTS) tailored for specific tasks, balancing cost, speed, and power.
- **No Integrated Oversight:** The systems are typically designed for one user role. We provide an integrated Admin Dashboard for complete institutional monitoring and analytics.

---

## 🧩 Slide 7 – System Architecture

### Core Components

- **Frontend:** A responsive Single-Page Application built with **React** and **Tailwind CSS**.
- **AI Services:** Directly integrated with the **Google Gemini API** (`@google/genai` SDK).
- **Data Storage:** Utilizes browser **`localStorage`** for data persistence in this prototype.
- **Math Rendering:** Uses **KaTeX** for high-quality mathematical notation.

### AI Functions (Agents)

- **Quiz Generation Agent:** (`gemini-2.5-flash`) Creates quizzes from various contexts.
- **Grading Agent:** (`gemini-2.5-flash`) Evaluates submissions and provides detailed feedback.
- **Tutor Agent:** (`gemini-2.5-flash-lite` for text, `gemini-2.5-flash-native-audio` for voice) Powers a real-time student tutor.
- **Refinement Agent:** (`gemini-2.5-flash`) Improves the clarity of questions on demand.
- **Analytics Agent:** (`gemini-2.5-pro` with Thinking Mode) Generates deep institutional insights.

---

## 🧩 Slide 8 – Teacher Dashboard & Features

**Purpose:** Empower teachers to create & manage quizzes.

### Key Features

- Upload course material (text, `.txt` files, images).
- AI automatically extracts context & generates MCQs & short answers.
- Review, edit, and **refine questions with AI assistance**.
- Track student performance through detailed analytics.
- **AI Content Assistant** for summarizing or explaining uploaded material.

**AI Functions Involved:**
Quiz Generation Agent, Refinement Agent, Analytics Agent.

---

## 🧩 Slide 9 – Student Dashboard & Experience

**Purpose:** Provide a personalized learning experience.

### Key Features

- View available quizzes and track progress with a visual chart.
- Attempt interactive quizzes with a timer.
- Receive instant, detailed AI-generated feedback.
- Engage with a **dual-mode AI Tutor** (Text Chat & Live Voice Conversation).

**AI Functions Involved:**
Grading Agent, Tutor Agent (Text & Voice), TTS Agent.

---

## 🧩 Slide 10 – Quiz Interface & Feedback Flow

### Quiz Page Design

- Clean interface with timer and navigation buttons.
- Supports both MCQs and short answers with **KaTeX math rendering**.

### Feedback Page

- Displays score using a visual donut chart.
- Provides question-by-question reasoning for the grade.
- **Listen to AI feedback** with integrated Text-to-Speech (TTS).
- AI suggests topics for improvement.

---

## 🧩 Slide 11 – Admin Panel

**Purpose:** Manage and monitor the entire platform.

### Key Functions

- View & manage teachers and students (CRUD operations).
- Monitor platform stats (total users, quizzes, submissions).
- Deploy an **AI agent to generate an institutional performance report**.
- Access system logs and backups (conceptual for this prototype).

**AI Involved:**
Analytics Agent (powered by `gemini-2.5-pro`).

---

## 🧩 Slide 12 – Role-Based Dashboards

| Role      | Dashboard Highlights                         | Main AI Functions Used                      |
| :-------- | :------------------------------------------- | :------------------------------------------ |
| **Teacher** | Upload, Generate, Review, Publish, Analytics | Quiz Generation, Refinement, Content Analysis |
| **Student** | Quizzes, Feedback, Progress, AI Tutor        | Grading, Tutor (Text/Voice), TTS            |
| **Admin**   | User Mgmt, Stats, AI-Powered Reports         | Analytics Agent                             |

---

## 🧩 Slide 13 – AI-Powered Workflow

1.  **Teacher** provides context (topic, text, image, doc).
2.  **Quiz Generation Agent** creates a draft quiz.
3.  **Teacher** reviews, edits, and uses the **Refinement Agent** to improve questions.
4.  **Student** takes the published quiz.
5.  **Grading Agent** instantly scores the submission and provides detailed feedback.
6.  **Student** reviews results, listens via **TTS**, and consults the **Tutor Agent** for help.
7.  **Admin** uses the **Analytics Agent** to get a high-level overview of performance.

---

## 🧩 Slide 14 – Tech Stack

### Frontend & UI

- **React** (with Hooks & Context API for state management)
- **Tailwind CSS** for styling
- **KaTeX** for mathematical typesetting

### AI & Gemini Integration

- **`@google/genai` SDK** for all AI features
- **`gemini-2.5-flash`**: For quiz generation, grading, and refinement.
- **`gemini-2.5-pro`**: For complex analytics with Thinking Mode.
- **`gemini-2.5-flash-lite`**: For low-latency text-based tutoring.
- **`gemini-2.5-flash-native-audio-preview-09-2025`**: For real-time voice conversations (Live API).
- **`gemini-2.5-flash-preview-tts`**: For text-to-speech feedback.

### Data Storage

- **Browser `localStorage`** (for prototype data persistence).

---

## 🧩 Slide 15 – UI & UX Design Summary

- **Theme:** Clean Academic AI Aesthetic
- **Colors:** Sky Blue • Mint Green • White • Light Gray
- **Typography:** Inter
- **Style:** Rounded cards, glass effects, AI “Thinking…” animations
- **Experience:** Responsive across desktop, tablet, mobile
- **User Focus:**
    - **Teachers** → Productivity
    - **Students** → Motivation
    - **Admins** → Control & Stability

---

## 🧩 Slide 16 – Workflow Diagram

(Visual slide – explain flow with arrows)

Teacher (Create) → AI (Generate/Refine) → Student (Attempt) → AI (Grade/Feedback) → AI (Tutor) → Admin (Analyze)

---

## 🧩 Slide 17 – Expected Outcomes

- 80% reduction in manual quiz creation time.
- Instant, personalized feedback improves student learning.
- Teachers gain deep insights through AI analytics.
- Scalable model for schools, colleges, and ed-tech platforms.

---

## 🧩 Slide 18 – Conclusion

EduTutor Agent (QuizMind) redefines digital learning by combining:

- Automation + Adaptation + AI Reasoning.

It supports teachers, guides students, and manages evaluation using a **suite of specialized functions from the Google Gemini API**.
With its intuitive, role-based dashboards, it represents the next generation of intelligent assessment systems.

---

## 🧩 Slide 19 – References

- Lasse Karvinen (2023) – GPT-3.5 pre-question system for self-learning.
- Rupali Goyal et al. (2024) – T5-based automated QA system.
- Ching Nam Hang et al. (2024) – MCQGen using GPT-4 with RAG.
- Bidyut Das et al. (2022) – Subjective evaluation with MCDM techniques.
- Steven Moore (2024) – SAQUET for human-AI quiz creation.
- Pradeesh N. et al. (2025) – RAG for contextual MCQs.
- Dishank Aggarwal et al. (2025) – EngSAF short-answer grading & feedback.
- Wenhui Kang et al. (2025) – TutorCraftEase for teacher AI question assistance.