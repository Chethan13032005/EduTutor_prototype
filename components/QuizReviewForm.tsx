
import React, { useState } from 'react';
import type { Quiz, MCQ, ShortAnswerQuestion } from '../types';
import { refineQuestionText } from '../services/geminiService';
import { MathRenderer } from './MathRenderer';

const SparklesIcon: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    if (isLoading) {
        return <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 12a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
    );
}

interface QuizReviewFormProps {
    initialQuiz: Quiz;
    onSave: (editedQuiz: Quiz) => void;
    onCancel: () => void;
}

export const QuizReviewForm: React.FC<QuizReviewFormProps> = ({ initialQuiz, onSave, onCancel }) => {
    const [editedQuiz, setEditedQuiz] = useState<Quiz>(initialQuiz);
    const [refiningId, setRefiningId] = useState<string | null>(null);

    const handleMcqQuestionChange = (mcqId: string, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            mcqs: prev.mcqs.map(q => q.id === mcqId ? { ...q, question: value } : q)
        }));
    };

    const handleMcqOptionChange = (mcqId: string, optionIndex: number, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            mcqs: prev.mcqs.map(q => q.id === mcqId ? {
                ...q,
                options: q.options.map((opt, i) => i === optionIndex ? value : opt)
            } : q)
        }));
    };

    const handleMcqCorrectAnswerChange = (mcqId: string, index: number) => {
        setEditedQuiz(prev => ({
            ...prev,
            mcqs: prev.mcqs.map(q => q.id === mcqId ? { ...q, correctAnswerIndex: index } : q)
        }));
    };

    const handleMcqExplanationChange = (mcqId: string, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            mcqs: prev.mcqs.map(q => q.id === mcqId ? { ...q, explanation: value } : q)
        }));
    };

    const handleSaqQuestionChange = (saqId: string, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            shortAnswerQuestions: prev.shortAnswerQuestions.map(q => q.id === saqId ? { ...q, question: value } : q)
        }));
    };

    const handleSaqModelAnswerChange = (saqId: string, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            shortAnswerQuestions: prev.shortAnswerQuestions.map(q => q.id === saqId ? { ...q, modelAnswer: value } : q)
        }));
    };

    const handleSaqExplanationChange = (saqId: string, value: string) => {
        setEditedQuiz(prev => ({
            ...prev,
            shortAnswerQuestions: prev.shortAnswerQuestions.map(q => q.id === saqId ? { ...q, explanation: value } : q)
        }));
    };


    const handleRefineQuestion = async (id: string, currentText: string, type: 'mcq' | 'saq') => {
        setRefiningId(id);
        try {
            const refinedText = await refineQuestionText(currentText);
            if (type === 'mcq') {
                handleMcqQuestionChange(id, refinedText);
            } else {
                handleSaqQuestionChange(id, refinedText);
            }
        } catch (error) {
            console.error("Failed to refine question:", error);
            alert("The AI agent could not refine the question at this time.");
        } finally {
            setRefiningId(null);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedQuiz);
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in-up">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Review & Finalize Quiz</h2>
                <p className="text-slate-600 mb-8">The AI agent has generated the questions. Verify the correct answers and explanations before publishing.</p>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {editedQuiz.mcqs.map((mcq, index) => (
                        <div key={mcq.id} className="border-t border-slate-200 pt-8">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-lg font-bold text-slate-800">MCQ {index + 1}</label>
                                <button type="button" onClick={() => handleRefineQuestion(mcq.id, mcq.question, 'mcq')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50 disabled:cursor-not-allowed" disabled={!!refiningId}>
                                    <SparklesIcon isLoading={refiningId === mcq.id} />
                                    {refiningId === mcq.id ? 'Refining...' : 'Refine Question'}
                                </button>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Question Text</label>
                                <textarea
                                    value={mcq.question}
                                    onChange={(e) => handleMcqQuestionChange(mcq.id, e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-200 outline-none"
                                    rows={2}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                                {mcq.options.map((option, i) => (
                                    <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border ${mcq.correctAnswerIndex === i ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <input
                                            type="radio"
                                            name={`correct-${mcq.id}`}
                                            checked={mcq.correctAnswerIndex === i}
                                            onChange={() => handleMcqCorrectAnswerChange(mcq.id, i)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                                            title="Mark as correct answer"
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleMcqOptionChange(mcq.id, i, e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700"
                                        />
                                        {mcq.correctAnswerIndex === i && <span className="text-xs font-bold text-green-600 uppercase whitespace-nowrap">Correct Answer</span>}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pl-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Explanation (Why is this correct?)</label>
                                <textarea
                                    value={mcq.explanation}
                                    onChange={(e) => handleMcqExplanationChange(mcq.id, e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors"
                                    rows={2}
                                    placeholder="AI generated explanation..."
                                />
                            </div>
                        </div>
                    ))}

                    {editedQuiz.shortAnswerQuestions.map((saq, index) => (
                         <div key={saq.id} className="border-t border-slate-200 pt-8">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-lg font-bold text-slate-800">Short Answer {index + 1}</label>
                                 <button type="button" onClick={() => handleRefineQuestion(saq.id, saq.question, 'saq')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50 disabled:cursor-not-allowed" disabled={!!refiningId}>
                                    <SparklesIcon isLoading={refiningId === saq.id} />
                                    {refiningId === saq.id ? 'Refining...' : 'Refine Question'}
                                </button>
                            </div>
                             <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Question Text</label>
                                <textarea
                                    value={saq.question}
                                    onChange={(e) => handleSaqQuestionChange(saq.id, e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-200 outline-none"
                                    rows={2}
                                />
                            </div>
                            
                            <div className="space-y-4 pl-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Model Answer / Key Points</label>
                                    <textarea
                                        value={saq.modelAnswer}
                                        onChange={(e) => handleSaqModelAnswerChange(saq.id, e.target.value)}
                                        className="w-full p-3 border border-green-200 bg-green-50/30 rounded-lg text-sm"
                                        rows={2}
                                        placeholder="Expected answer..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Explanation / Concept</label>
                                    <textarea
                                        value={saq.explanation}
                                        onChange={(e) => handleSaqExplanationChange(saq.id, e.target.value)}
                                        className="w-full p-3 border border-slate-300 rounded-lg text-sm bg-slate-50"
                                        rows={2}
                                        placeholder="Core concept explanation..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="pt-8 border-t border-slate-200 flex justify-end gap-4 sticky bottom-0 bg-white pb-2 z-10">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Discard Changes
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                            Publish Quiz
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
