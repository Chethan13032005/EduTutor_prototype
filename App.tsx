import React from 'react';
import { AppState } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { QuizDisplay } from './components/QuizDisplay';
import { ResultsDisplay } from './components/ResultsDisplay';
import { StudentAITutor } from './components/StudentAITutor';
import { TeacherAIHelper } from './components/TeacherAIHelper';
import { useAppContext } from './hooks/useAppContext';
import { LoadingSpinner } from './components/LoadingSpinner';

const App: React.FC = () => {
    const {
        appState,
        currentUser,
        currentQuiz,
        results,
        error,
        isLoadingApp,
        isLoading,
    } = useAppContext();

    const getDisplayTopic = (): string => {
        if (!currentQuiz?.context) return '';
        switch (currentQuiz.context.type) {
            case 'topic':
                return currentQuiz.context.content as string;
            case 'text':
                return 'Custom Provided Text';
            case 'image':
            case 'document':
                return (currentQuiz.context.content as File).name;
            default:
                return 'Custom Quiz';
        }
    };

    const renderContent = () => {
        if (isLoadingApp) {
            return <LoadingSpinner text="Loading Application..." />;
        }

        if (error) {
            return (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 w-full max-w-4xl rounded-r-lg animate-in" role="alert">
                    <p className="font-bold">An Error Occurred</p>
                    <p>{error}</p>
                </div>
            )
        }

        let content;
        switch (appState) {
            case AppState.LOGIN:
                content = <LoginPage />;
                break;
            case AppState.ADMIN_DASHBOARD:
                content = <AdminDashboard />;
                break;
            case AppState.TEACHER_DASHBOARD:
                content = <TeacherDashboard />;
                break;
            case AppState.TEACHER_AI_HELPER:
                content = <TeacherAIHelper />;
                break;
            case AppState.STUDENT_DASHBOARD:
                content = <StudentDashboard />;
                break;
            case AppState.STUDENT_AI_TUTOR:
                content = <StudentAITutor />;
                break;
            case AppState.TAKING_QUIZ:
                if (currentQuiz) {
                    content = <QuizDisplay quiz={currentQuiz.quiz} topic={getDisplayTopic()} />;
                }
                break;
            case AppState.GRADING:
                content = <LoadingSpinner text="The Grading Agent is on the case..." />;
                break;
            case AppState.RESULTS:
                if (results) {
                    content = <ResultsDisplay results={results} />;
                }
                break;
            default:
                content = <LoginPage />;
        }
        return <div className="w-full animate-in" style={{ animationName: 'slideUp', animationDuration: '0.7s'}}>{content}</div>;
    };

    const backgroundClass = appState === AppState.LOGIN 
        ? "login-background" 
        : "app-background";

    return (
        <div className={`min-h-screen ${backgroundClass} text-slate-900 font-sans flex flex-col transition-colors duration-500`}>
            {appState !== AppState.LOGIN && <Header />}
            <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 w-full">
                 {isLoading && appState !== AppState.GRADING && <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center"><LoadingSpinner text="Agent is thinking..." /></div>}
                {renderContent()}
            </main>
             {appState !== AppState.LOGIN && <Footer />}
        </div>
    );
};

export default App;