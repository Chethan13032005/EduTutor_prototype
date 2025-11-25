
import React, { useState, useEffect } from 'react';
import type { Quiz, UserAnswers } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { MathRenderer } from './MathRenderer';

const ConfirmationModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-enter">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-[Outfit]">Submit Quiz?</h3>
            <p className="text-slate-500 my-4 leading-relaxed">You are about to submit your answers. You won't be able to change them afterwards.</p>
            <div className="flex justify-center gap-3 mt-6">
                <button onClick={onCancel} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Not yet</button>
                <button onClick={onConfirm} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105">Yes, Submit</button>
            </div>
        </div>
    </div>
);

export const QuizDisplay: React.FC<{ quiz: Quiz; topic: string; }> = ({ quiz, topic }) => {
    const { submitQuiz, appState } = useAppContext(); // appState needed to disable inputs during grading
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [timeLeft, setTimeLeft] = useState(quiz.mcqs.length * 60 + quiz.shortAnswerQuestions.length * 120);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const allQuestions = [...quiz.mcqs, ...quiz.shortAnswerQuestions];
    const currentQuestion = allQuestions[currentQuestionIndex];
    const isMcq = 'options' in currentQuestion;
    
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAnswer = (questionId: string, answer: string | number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };
    
    const handleFinalSubmit = async () => {
        setShowConfirmation(false);
        setIsSubmitting(true);
        await submitQuiz(quiz, answers);
        setIsSubmitting(false);
    };

    const progressPercentage = ((currentQuestionIndex + 1) / allQuestions.length) * 100;
    const answeredCount = Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length;

    // If Grading state is active in parent, show loading overlay here or allow parent to handle.
    // The parent App.tsx switches view on state change, but the submit button needs visual feedback immediately.

    if (isSubmitting) {
         return (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <span className="text-4xl">🤖</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 font-[Outfit] mb-2">AI Grading in Progress...</h2>
                <p className="text-slate-500">Analyzing your logic and calculating scores.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto pb-12 relative">
             {showConfirmation && <ConfirmationModal onConfirm={handleFinalSubmit} onCancel={() => setShowConfirmation(false)} />}
            
            {/* Sticky Header */}
            <div className="sticky top-20 z-40 mb-6">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between transition-all">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quiz in Progress</p>
                        <h2 className="text-lg font-bold text-slate-800 truncate max-w-[150px] sm:max-w-xs">{quiz.title || topic}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs text-slate-400 font-bold">Progress</p>
                            <p className="text-sm font-bold text-indigo-600">{answeredCount} / {allQuestions.length}</p>
                        </div>
                        <div className={`font-mono text-xl font-bold px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
                {/* Progress Bar integrated into sticky header bottom */}
                <div className="h-1.5 w-full bg-slate-200 mt-[-2px] rounded-b-2xl overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 sm:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <span className="bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-1 rounded-full border border-indigo-100">
                            Question {currentQuestionIndex + 1}
                        </span>
                    </div>

                    <div className="min-h-[300px]">
                        <div className="text-2xl sm:text-3xl font-bold text-slate-800 mb-8 leading-snug font-[Outfit]">
                            <MathRenderer text={currentQuestion.question} />
                        </div>

                        {isMcq ? (
                            <div className="grid grid-cols-1 gap-4">
                                {(currentQuestion as any).options.map((option: string, i: number) => {
                                    const isSelected = answers[currentQuestion.id] === i;
                                    return (
                                        <label 
                                            key={i} 
                                            className={`group relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}
                                        >
                                            <input 
                                                type="radio" 
                                                name={currentQuestion.id} 
                                                value={i} 
                                                checked={isSelected} 
                                                onChange={() => handleAnswer(currentQuestion.id, i)} 
                                                className="peer sr-only" 
                                            />
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-lg ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                                                <MathRenderer text={option} />
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    value={(answers[currentQuestion.id] as string) || ''}
                                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                    className="w-full h-64 p-6 text-lg border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 focus:outline-none transition resize-none bg-slate-50 focus:bg-white"
                                    placeholder="Type your answer here..."
                                />
                                <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium">
                                    PRESS TAB TO EXIT
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="bg-slate-50 p-6 sm:px-10 border-t border-slate-100 flex justify-between items-center">
                    <button 
                        onClick={handlePrev} 
                        disabled={currentQuestionIndex === 0} 
                        className="px-6 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        Back
                    </button>
                    
                    {currentQuestionIndex < allQuestions.length - 1 ? (
                        <button 
                            onClick={handleNext} 
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 flex items-center gap-2"
                        >
                            Next Question
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    ) : (
                        <button 
                            onClick={() => setShowConfirmation(true)} 
                            disabled={answeredCount < allQuestions.length} 
                            className="px-10 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Finish Quiz
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
