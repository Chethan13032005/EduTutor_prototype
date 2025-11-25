
import React, { useState, useEffect, useCallback } from 'react';
import { QuizCreationForm } from './QuizCreationForm';
import { LoadingSpinner } from './LoadingSpinner';
import { QuizAnalytics } from './QuizAnalytics';
import { QuizReviewForm } from './QuizReviewForm';
import { generateQuiz } from '../services/geminiService';
import { saveQuiz, getAllQuizzes, getSubmissionsForQuiz, updateQuiz, deleteQuiz } from '../services/storageService';
import type { StoredQuiz, InputContext, StoredSubmission, QuizConfig, Quiz } from '../types';
import { useAppContext } from '../hooks/useAppContext';

type TeacherView = 'dashboard' | 'create' | 'review' | 'created' | 'analytics';

export const TeacherDashboard: React.FC = () => {
    const { currentUser: teacher, startTeacherHelper } = useAppContext();
    const [view, setView] = useState<TeacherView>('dashboard');
    const [quizzes, setQuizzes] = useState<StoredQuiz[]>([]);
    const [submissionsMap, setSubmissionsMap] = useState<Record<string, StoredSubmission[]>>({});
    const [newlyCreatedQuiz, setNewlyCreatedQuiz] = useState<StoredQuiz | null>(null);
    const [quizToReview, setQuizToReview] = useState<{quiz: Quiz, context: InputContext} | null>(null);
    const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
    const [selectedQuiz, setSelectedQuiz] = useState<StoredQuiz | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!teacher) return;
        // Fetch latest data from storage (now async via API)
        const allQuizzes = await getAllQuizzes();
        const teacherQuizzes = allQuizzes.filter(q => q.teacherId === teacher.id);
        setQuizzes(teacherQuizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        const subs: Record<string, StoredSubmission[]> = {};
        // We can optimize this by fetching all submissions once if API supports it, 
        // but for now we iterate (assuming local dev speed is fine)
        for (const quiz of teacherQuizzes) {
            subs[quiz.id] = await getSubmissionsForQuiz(quiz.id);
        }
        setSubmissionsMap(subs);
    }, [teacher]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleQuizCreationSubmit = async (context: InputContext, config: QuizConfig) => {
        setIsLoading(true); setError(null);
        try {
            const generatedQuiz = await generateQuiz(context, config);
            setQuizToReview({ quiz: generatedQuiz, context });
            setView('review');
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setView('create'); 
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveReviewedQuiz = async (editedQuiz: Quiz) => {
        if (!teacher) return;

        if (editingQuizId) {
            // Update existing
            await updateQuiz(editingQuizId, editedQuiz);
            setEditingQuizId(null);
            setQuizToReview(null);
            setView('dashboard');
        } else {
            // Create new
            if (!quizToReview) return;
            const newQuiz = await saveQuiz(editedQuiz, quizToReview.context, teacher.id);
            setNewlyCreatedQuiz(newQuiz);
            setQuizToReview(null);
            setView('created');
        }
        loadData();
    };

    const handleEditQuiz = (e: React.MouseEvent, quiz: StoredQuiz) => {
        e.stopPropagation();
        setEditingQuizId(quiz.id);
        setQuizToReview({ quiz: quiz.quiz, context: quiz.context });
        setView('review');
    };

    const handleDeleteQuiz = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); 
        if (window.confirm("Are you sure you want to delete this quiz? All associated student submissions will also be permanently removed.")) {
            // Perform actual delete
            await deleteQuiz(id);
            // Reload to ensure data consistency
            loadData();
        }
    };

    const handleReviewCancel = () => {
        if (editingQuizId) {
            // If editing, go back to dashboard
            setEditingQuizId(null);
            setQuizToReview(null);
            setView('dashboard');
        } else {
            // If creating, go back to create form
            setQuizToReview(null);
            setView('create');
        }
    };

    if (!teacher) return <LoadingSpinner text="Loading teacher data..." />;

    const renderContent = () => {
        if (isLoading) return <LoadingSpinner text="Your Curriculum Design Agent is working..." />;
        
        switch(view) {
            case 'create':
                return (
                    <div className="w-full max-w-4xl mx-auto animate-enter">
                        <div className="mb-6">
                             <button onClick={() => setView('dashboard')} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-2 transition-colors px-4 py-2 rounded-lg hover:bg-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path></svg> Back to Dashboard
                            </button>
                        </div>
                        {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl shadow-sm mb-6" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
                        <QuizCreationForm onSubmit={handleQuizCreationSubmit} isLoading={isLoading} />
                    </div>
                );
            case 'review':
                if (quizToReview) return <QuizReviewForm initialQuiz={quizToReview.quiz} onSave={handleSaveReviewedQuiz} onCancel={handleReviewCancel} />;
                return null;
            case 'created':
                 if (newlyCreatedQuiz) return (
                    <div className="flex flex-col items-center justify-center py-12 animate-enter">
                        <div className="glass-card p-12 rounded-[2.5rem] shadow-2xl w-full max-w-lg text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-4xl font-extrabold text-slate-800 mb-3 font-[Outfit]">Quiz Published!</h2>
                            <p className="text-slate-500 mb-10 text-lg">Your assessment is ready for students.</p>
                            
                            <button onClick={() => { setView('dashboard'); setNewlyCreatedQuiz(null); }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-indigo-600 transition-all transform hover:-translate-y-1">
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                );
                return null;
            case 'analytics':
                 if (selectedQuiz) return <QuizAnalytics quiz={selectedQuiz} submissions={submissionsMap[selectedQuiz.id] || []} onBack={() => setView('dashboard')} />;
                 return null;
            case 'dashboard':
            default:
                return (
                     <div className="animate-enter">
                        {/* Dashboard Header Card */}
                        <div className="glass-card rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-white to-indigo-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 font-[Outfit]">Curriculum Manager</h3>
                                <p className="text-slate-500 mt-1">Manage your active assessments and track performance.</p>
                            </div>
                            <button 
                                onClick={() => setView('create')} 
                                className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"></path></svg>
                                Create New Quiz
                            </button>
                        </div>

                        {quizzes.length === 0 ? (
                            <div className="text-center py-24 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 backdrop-blur-sm">
                                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400 animate-pulse">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-3 font-[Outfit]">No active quizzes</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">Get started by using the AI agent to generate a quiz from your teaching materials.</p>
                                <button onClick={() => setView('create')} className="text-indigo-600 font-bold hover:text-indigo-800 underline underline-offset-4 decoration-2">Create your first quiz now</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {quizzes.map(quiz => (
                                    <div key={quiz.id} className="group bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 flex flex-col overflow-hidden relative">
                                        {/* Card Header Gradient */}
                                        <div className="h-3 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        <div className="p-8 flex-1">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                    {quiz.context.type}
                                                </span>
                                                <span className="text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <h4 className="font-bold text-slate-800 text-2xl mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors font-[Outfit] leading-tight">
                                                {quiz.title}
                                            </h4>
                                            
                                            {/* Removed Code Badge here as requested */}
                                            
                                        </div>
                                        
                                        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-colors">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                                <span className="text-xs text-slate-600 font-bold hidden sm:inline">
                                                    {submissionsMap[quiz.id]?.length || 0} Subs
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => { setSelectedQuiz(quiz); setView('analytics'); }} 
                                                    className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors"
                                                    title="Analytics"
                                                >
                                                    Analytics
                                                </button>
                                                <button 
                                                    onClick={(e) => handleEditQuiz(e, quiz)} 
                                                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                                                    title="Edit Quiz"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                 <button 
                                                    onClick={(e) => handleDeleteQuiz(e, quiz.id)} 
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                    title="Delete Quiz"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-5xl font-extrabold text-slate-900 font-[Outfit] tracking-tight">Teacher Dashboard</h2>
                    <p className="text-lg text-slate-500 mt-2 font-light">Orchestrate your curriculum with AI-powered tools.</p>
                </div>
                <div className="flex items-center gap-4">
                     {view === 'dashboard' && (
                        <button 
                            onClick={startTeacherHelper} 
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm hover:shadow-md"
                        >
                            <span className="text-xl">🤖</span> AI Assistant
                        </button>
                     )}
                </div>
            </div>
            {renderContent()}
        </div>
    );
};
