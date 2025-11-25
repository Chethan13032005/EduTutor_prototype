# EduTutor Agent (QuizMind)

An AI-powered assessment and feedback system that generates quizzes, grades answers, and gives personalized reasoning-based feedback.

## ⚙️ 1️⃣ System Overview

| Feature | Description |
| :--- | :--- |
| **Platform Type** | Web App (Responsive UI) |
| **Primary Users** | Teachers 👩‍🏫, Students 🎓, Admins 🧑‍💼 |
| **Tech Stack** | FastAPI / Flask + MongoDB + LangChain Agents + React/Tailwind UI |
| **Core AI Modules** | QG-Agent (Question Generator), Grader-Agent, Tutor-Agent, Instructor-Agent, Orchestrator |
| **Objective** | Automate quiz lifecycle — generation, grading, and adaptive feedback. |
| **Design Language** | Academic, minimalist, pastel blue–mint color theme, glass UI elements, rounded cards, Poppins font. |

## 🧑‍🏫 2️⃣ TEACHER USER FLOW & PAGES

### 📄 Page 1: Login Page
**Purpose**: Secure entry with role selection.

**UI Layout**:
- **Left**: Animated AI-themed illustration (teacher & robot).
- **Right**: Login form → Email, Password, Role dropdown.
- **Buttons**: Login, Register, Forgot Password.
- **Footer**: “Powered by EduTutor AI”.

**Flow**:
Upon login, redirects to `/teacher/dashboard`.

### 🧭 Page 2: Teacher Dashboard
**Purpose**: Central hub for all teaching actions.

**Layout**:
- **Top Navbar**: Logo (left), Profile icon (right).
- **Left Sidebar**: Dashboard | Upload Material | Generate Questions | Review | Publish | Analytics.
- **Main Area**:
    - Quick Stats Cards (e.g., “3 Quizzes Published”, “78 Students Active”).
    - Graphs showing student performance trends.
    - Shortcut Buttons: “Upload Material”, “Generate New Quiz”.

### 📤 Page 3: Upload Material Page
**Purpose**: Teacher uploads course files for question generation.

**UI**:
- Drag-and-drop upload card (supports PDF, DOCX, PPTX, JPG, PNG).
- Preview section: shows filename, file size.
- **Button**: Extract Text & Analyze.
- **Loader**: “AI extracting content using OCR + NLP…”

**AI Triggered**:
→ Orchestrator-Agent → QG-Agent begins question generation.

### 🧠 Page 4: Generate Questions Page
**Purpose**: Generate MCQs and short-answer questions.

**UI**:
- “AI Question Generator” header.
- Option inputs:
    - Question Type (MCQ/Short/Descriptive).
    - Difficulty (Easy/Medium/Hard).
    - No. of Questions.
- **Button**: Generate Questions.
- Table below showing:
| ID | Question | Type | Difficulty | Edit | Delete |
- Floating button: Save Draft.

**AI Triggered**:
→ QG-Agent (Question Generation)
→ Instructor-Agent validates clarity & tags difficulty.

### 🧾 Page 5: Review & Publish Page
**Purpose**: Finalize and release quizzes.

**UI**:
- Table of all generated questions with checkboxes.
- Toggle: “Review Mode” → highlight ambiguous questions (from Instructor-Agent feedback).
- **Button**: Publish Quiz.
- Modal confirmation: “Are you sure you want to publish this quiz?”

**Backend Flow**:
- Saves quiz to DB → visible to students.

### 📊 Page 6: Teacher Analytics Page
**Purpose**: Visualize class performance & AI insights.

**UI**:
- **Cards**:
    - Avg Score
    - Most Missed Topic
    - Top Student
- **Charts**:
    - Bar chart: Quiz-wise performance
    - Pie chart: Topic mastery distribution
    - Line chart: Overall improvement trend
- **AI Insights Section**:
    - “Students struggle most with OS Deadlocks. 55% average accuracy.”
- **Buttons**: Download Report, Export to Excel.

**AI Triggered**:
→ Instructor-Agent + Orchestrator-Agent

## 🎓 3️⃣ STUDENT USER FLOW & PAGES

### 📄 Page 1: Login Page
Same as teacher login, but role set to “Student” → redirects to `/student/dashboard`.

### 🏠 Page 2: Student Dashboard
**Purpose**: Personalized learning home.

**Layout**:
- **Header**: “Welcome, Chethan 👋”
- **Cards Grid**:
    - “Available Quizzes”
    - “Recent Feedback”
    - “Progress Summary”
- **Sidebar Links**: Take Quiz | Feedback | Analytics | Settings.
- **AI Suggestions Box**:
    - “You’re doing great in DBMS, but let’s revise OS Scheduling.”

**AI Triggered**:
→ Tutor-Agent (generates suggestions from progress data).

### 🧩 Page 3: Take Quiz Page
**Purpose**: Attempt quizzes with timer & question navigation.

**UI**:
- **Header**: Quiz Title | Timer (top-right).
- **Question Card**:
    - For MCQs → radio button list.
    - For short answer → textbox.
- **Footer Buttons**: Previous, Next, Submit.
- Progress bar: “Question 4 of 10”.

**Flow**:
Upon submission → answers sent to Grader-Agent.

### 📈 Page 4: Result & Feedback Page
**Purpose**: Give personalized, reasoning-based feedback.

**UI**:
- **Header**: “Your Quiz Results Are Ready!”
- **Center Card**: Circular score gauge (e.g., 82%).
- **Feedback Table**:
    - Q1: Correct ✅ — “Concept clear, well explained.”
    - Q2: Partial ⚠️ — “Missed keyword ‘inheritance’.”
    - Q3: Wrong ❌ — “Revisit Chapter 3.”
- **Section**:
    - “Suggested Topics for Improvement”
    - “Retake Similar Quiz” (Button → triggers Tutor-Agent).

**AI Triggered**:
→ Grader-Agent (marks & feedback)
→ Feedback-Agent (textual reasoning).

### 📊 Page 5: Student Progress Page
**Purpose**: Track performance visually.

**UI**:
- **Charts**:
    - Line Chart: Scores vs Time.
    - Radar Chart: Topic strengths.
    - Pie Chart: Correct vs Incorrect.
- **AI Comment Box**:
    - “You improved 20% in OS since last month.”
- **Buttons**: Download Report, Try Recommended Quiz.

**AI Triggered**:
→ Tutor-Agent monitors learning curve.

## 🧑‍💼 4️⃣ ADMIN USER FLOW & PAGES

### 📄 Page 1: Admin Login
Same layout but role = Admin → `/admin/panel`.

### 🧭 Page 2: Admin Panel
**Purpose**: Manage platform operations & AI agent status.

**UI**:
- **Sidebar Tabs**:
    - Dashboard
    - Manage Users
    - Agent Health
    - System Logs
    - Backup & Export
- **Top Cards**:
    - Total Teachers, Total Students, Active Quizzes.
- **Main Table**:
| User | Role | Status | Last Login | Edit/Delete |
- **AI Agent Status Cards**:
    - QG-Agent ✅ Active
    - Grader-Agent ⚙️ Evaluating
    - Tutor-Agent ✅ Running
    - Orchestrator-Agent ✅ Monitoring
- **Graphs**: System load, performance metrics.
- **Button**: “Download Logs” / “Backup Database”.

**AI Triggered**:
→ Orchestrator-Agent sends heartbeat status and logs.

## 🧩 5️⃣ COMMON SYSTEM COMPONENTS

| Component | Function |
| :--- | :--- |
| **Auth Module** | JWT-based login & role-based routes |
| **LLM Interface** | Connects to GPT-4 / T5 models for QG & feedback |
| **RAG Engine** | Retrieves content from teacher uploads for accurate question creation |
| **Database (MongoDB)** | Stores users, quizzes, answers, feedback |
| **Vector Store (ChromaDB)** | Stores embeddings for semantic grading & context retrieval |
| **Background Tasks** | Celery/Redis for async question generation |
| **Reports & Analytics** | Generates visual reports for teachers and students |
| **Logs/Monitoring** | Tracks AI agent health and app performance |

## 🔄 6️⃣ End-to-End Flow (User Journey)

- **🧑‍🏫 Teacher**: Login → Upload Notes → AI Generates Questions → Review/Edit → Publish → View Analytics
- **🎓 Student**: Login → View Quizzes → Take Quiz → Get Graded Feedback → View Progress → Get AI Recommendations
- **🧑‍💼 Admin**: Login → Monitor Agents → Manage Users → Export Reports → Backup System

## 🧠 7️⃣ AI Agent Workflow Summary

| Agent | Function | Trigger Point | Output |
| :--- | :--- | :--- | :--- |
| **QG-Agent** | Generates quiz questions | Teacher uploads notes | Draft question list |
| **Instructor-Agent** | Reviews clarity & tags difficulty | Post-QG step | Question metadata |
| **Grader-Agent** | Grades answers using LLM + embeddings | Quiz submission | Marks + reasoning |
| **Feedback-Agent** | Crafts personalized feedback text | After grading | Per-question feedback |
| **Tutor-Agent** | Tracks progress, recommends next quiz | After feedback | Learning suggestions |
| **Orchestrator-Agent** | Manages all agent flows | Always active | Logs, retries, sync |

## 🧱 8️⃣ Visual Design Summary

| Feature | Style |
| :--- | :--- |
| **Theme** | Academic + AI minimalism |
| **Colors** | Sky Blue, Mint Green, White, Light Gray |
| **Typography** | Poppins / Inter |
| **Icons** | Lucide / Feather Icons |
| **Components** | Cards, Charts, Rounded Tables, Glass Panels |
| **Animations** | Smooth “AI Thinking…” loaders |
| **Responsiveness** | Works on mobile, tablet, desktop |
| **Brand Identity** | Clean, futuristic, educational aesthetic |

## 📦 9️⃣ Example Directory (UI + Backend)

```
quizmind/
├── frontend/
│   ├── pages/
│   │   ├── login.html
│   │   ├── teacher_dashboard.html
│   │   ├── student_dashboard.html
│   │   ├── quiz_interface.html
│   │   ├── feedback.html
│   │   ├── admin_panel.html
│   └── static/
│       ├── css/
│       ├── js/
│       └── images/
└── backend/
    ├── app/
    │   ├── agents/
    │   ├── routers/
    │   ├── models/
    │   ├── db/
    │   └── main.py
```

## 🎯 1️⃣0️⃣ Final Impression (For PPT / Viva)

“EduTutor Agent (QuizMind) is a multi-agent AI-driven platform that automates the entire assessment lifecycle — from question creation to feedback. Each user gets a personalized dashboard designed for their needs, combining adaptive learning with intelligent automation. The system uses NLP, RAG, and agentic reasoning to create a scalable, accurate, and human-like learning experience.”
