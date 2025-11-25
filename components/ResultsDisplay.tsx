
import React, { useState, useEffect } from 'react';
import type { GradedResults, GradedMCQ, GradedShortAnswer } from '../types';
import { generateSpeech, decode, decodeAudioData } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import { MathRenderer } from './MathRenderer';

// --- Components ---

const ComparativeChart: React.FC<{ studentScore: number }> = ({ studentScore }) => {
    const classAvg = 68;
    const topper = 95;
    const data = [
        { label: 'Your Score', value: studentScore, color: 'bg-indigo-600' },
        { label: 'Class Avg', value: classAvg, color: 'bg-slate-300' },
        { label: 'Topper', value: topper, color: 'bg-slate-200' }
    ];
    const max = 100;

    return (
        <div className="flex flex-col h-full justify-center">
            <div className="h-40 flex items-end justify-around gap-4 px-4 pb-2 border-b border-slate-100">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center w-1/3 group relative">
                         <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{item.value.toFixed(0)}%</div>
                        <div className={`w-12 sm:w-16 rounded-t-lg ${item.color} transition-all duration-1000 ease-out hover:opacity-90`} style={{ height: `${(item.value/max)*100}%` }}></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-around px-4 mt-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                {data.map((item, i) => <span key={i}>{item.label}</span>)}
            </div>
            <p className="text-xs text-center text-slate-400 mt-6 bg-slate-50 py-2 rounded-lg mx-4">
                You performed better than <span className="font-bold text-slate-700">65%</span> of your peers in this topic.
            </p>
        </div>
    );
};

const QuestionBreakdown: React.FC<{ result: GradedMCQ | GradedShortAnswer; index: number }> = ({ result, index }) => {
    const isMcq = 'options' in result;
    const isCorrect = isMcq ? result.isCorrect : result.score >= 3;
    
    // Color Schemes
    const borderColor = isCorrect ? 'border-emerald-500' : 'border-red-500';
    const headerBg = isCorrect ? 'bg-emerald-50' : 'bg-red-50';
    const statusColor = isCorrect ? 'text-emerald-700' : 'text-red-700';
    const statusLabel = isCorrect ? 'CORRECT' : 'INCORRECT';

    return (
        <div className={`border-2 rounded-xl bg-white overflow-hidden mb-6 ${borderColor} shadow-sm`}>
            {/* Header */}
            <div className={`p-4 flex justify-between items-center border-b ${isCorrect ? 'border-emerald-100' : 'border-red-100'} ${headerBg}`}>
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded uppercase tracking-wider bg-white border ${isCorrect ? 'border-emerald-200 text-emerald-700' : 'border-red-200 text-red-700'}`}>
                        {statusLabel}
                    </span>
                    <span className="text-slate-400 text-sm font-bold">Question {index}</span>
                </div>
                <div className="font-bold text-sm">
                    {isCorrect ? <span className="text-emerald-600">10/10 Points</span> : <span className="text-red-500">0/10 Points</span>}
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 leading-snug">
                    <MathRenderer text={result.question} />
                </h4>

                {/* AI Feedback Block */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AI Feedback</p>
                        <p className="text-sm text-slate-700 leading-relaxed"><MathRenderer text={result.feedback} /></p>
                    </div>

                    {!isCorrect && isMcq && (
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correct Answer</p>
                            <p className="text-sm text-emerald-600 font-bold">
                                <MathRenderer text={(result as GradedMCQ).options[(result as GradedMCQ).correctAnswerIndex]} />
                            </p>
                        </div>
                    )}
                    
                    <div className="pt-3 border-t border-slate-200">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 italic">Reasoning</p>
                         <p className="text-xs text-slate-500 italic leading-relaxed font-medium">
                            Concept tested: {(result as any).feedback.split('.')[0]}...
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ResultsDisplay: React.FC<{ results: GradedResults; }> = ({ results }) => {
    const { backToDashboard } = useAppContext();
    
    return (
        <div className="w-full max-w-6xl mx-auto pb-12 animate-enter font-[Inter]">
            
            {/* Top Section: Score & Badge */}
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 opacity-10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex-1">
                        <p className="text-orange-100 font-bold tracking-widest text-xs uppercase mb-2 border-b border-white/20 pb-2 inline-block">Quiz Complete</p>
                        <h1 className="text-7xl font-extrabold mb-4 tracking-tight">{results.scorePercentage.toFixed(0)}%</h1>
                        <div className="text-white/90 text-lg leading-relaxed font-medium max-w-2xl bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <MathRenderer text={results.overallFeedback} />
                        </div>
                    </div>
                    
                    {/* Badge Card */}
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-500">
                        <div className="text-center min-w-[160px]">
                            <p className="text-xs font-bold uppercase text-white/70 mb-2 tracking-widest">Badge Earned</p>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-6xl filter drop-shadow-lg animate-bounce-slow">
                                    {results.scorePercentage >= 80 ? '🏆' : results.scorePercentage >= 60 ? '🥈' : '🥉'}
                                </span>
                                <span className="text-2xl font-bold text-white">
                                    {results.scorePercentage >= 80 ? 'Gold' : results.scorePercentage >= 60 ? 'Silver' : 'Bronze'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                
                {/* AI Personal Tutor Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🤖</span>
                        <h3 className="text-xl font-bold text-slate-800">AI Personal Tutor</h3>
                    </div>

                    {/* Strengths & Weaknesses Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="mb-8">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Strong Areas
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {results.strengths && results.strengths.length > 0 ? results.strengths.map((s, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-full font-bold shadow-sm">
                                        {s}
                                    </span>
                                )) : <span className="text-slate-400 text-sm italic">Keep practicing to identify strengths!</span>}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 uppercase tracking-wider mb-4">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span> Areas to Improve
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {results.topicsToStudy && results.topicsToStudy.length > 0 ? results.topicsToStudy.map((t, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-full font-bold shadow-sm">
                                        {t}
                                    </span>
                                )) : <span className="text-slate-400 text-sm italic">No specific weak areas found. Great job!</span>}
                            </div>
                        </div>
                    </div>

                    {/* Study Plan Card */}
                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-inner">
                        <h4 className="flex items-center gap-2 text-indigo-800 font-bold mb-4">
                            <span className="text-xl">💡</span> Recommended Study Plan
                        </h4>
                        <div className="space-y-4">
                            {results.studyPlan && results.studyPlan.map((tip, i) => (
                                <div key={i} className="flex gap-4 text-sm text-indigo-900 leading-relaxed bg-white/60 p-3 rounded-xl border border-indigo-100/50">
                                    <span className="text-indigo-400 font-bold text-lg">•</span>
                                    <span className="font-medium"><MathRenderer text={tip} /></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Analysis Column */}
                <div className="space-y-6">
                     <div className="flex items-center gap-2 mb-1">
                         <span className="text-2xl">📊</span>
                        <h3 className="text-xl font-bold text-slate-800">Performance Analysis</h3>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full min-h-[300px] flex flex-col">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Score Comparison</h4>
                        <div className="flex-grow">
                             <ComparativeChart studentScore={results.scorePercentage} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Question Breakdown</h3>
                <div className="space-y-8">
                    {results.mcqResults.map((res, index) => (
                        <QuestionBreakdown key={res.id} result={res} index={index + 1} />
                    ))}
                    {results.shortAnswerResults.map((res, index) => (
                        <QuestionBreakdown key={res.id} result={res} index={results.mcqResults.length + index + 1} />
                    ))}
                </div>
            </div>

            <div className="text-center">
                 <button onClick={backToDashboard} className="px-12 py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    Back to Dashboard
                 </button>
            </div>
        </div>
    );
};
