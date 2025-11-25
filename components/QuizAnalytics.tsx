
import React, { useMemo } from 'react';
import type { StoredQuiz, StoredSubmission } from '../types';

interface QuizAnalyticsProps {
    quiz: StoredQuiz;
    submissions: StoredSubmission[];
    onBack: () => void;
}

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ChartBarIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const ExclamationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


export const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({ quiz, submissions, onBack }) => {

    const analyticsData = useMemo(() => {
        if (submissions.length === 0) {
            return { averageScore: 0, missedQuestions: [] };
        }

        const totalScore = submissions.reduce((acc, sub) => acc + sub.results.scorePercentage, 0);
        const averageScore = totalScore / submissions.length;

        const missedCount = new Map<string, number>();
        submissions.forEach(sub => {
            sub.results.mcqResults.forEach(res => {
                if (!res.isCorrect) {
                    missedCount.set(res.question, (missedCount.get(res.question) || 0) + 1);
                }
            });
             sub.results.shortAnswerResults.forEach(res => {
                // Consider a score below 3/5 as "missed" for analytics
                if (res.score < 3) {
                     missedCount.set(res.question, (missedCount.get(res.question) || 0) + 1);
                }
            })
        });
        
        const sortedMissed = Array.from(missedCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        return {
            averageScore,
            missedQuestions: sortedMissed
        };

    }, [submissions]);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
             <div>
                <button onClick={onBack} className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </button>
            </div>
            
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                 <h2 className="text-3xl font-bold mb-1">
                    Results: <span className="text-teal-400">{quiz.title}</span>
                </h2>
                <p className="text-slate-300">Quiz Code: <span className="font-mono">{quiz.id}</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="from-cyan-500 to-cyan-600 bg-gradient-to-br p-6 rounded-xl shadow-lg text-white flex justify-between items-center">
                    <div>
                        <p className="text-lg font-semibold text-cyan-100">Submissions</p>
                        <p className="text-5xl font-extrabold">{submissions.length}</p>
                    </div>
                    <UsersIcon/>
                </div>
                 <div className="from-teal-500 to-teal-600 bg-gradient-to-br p-6 rounded-xl shadow-lg text-white flex justify-between items-center">
                    <div>
                        <p className="text-lg font-semibold text-teal-100">Average Score</p>
                        <p className="text-5xl font-extrabold">{analyticsData.averageScore.toFixed(0)}%</p>
                    </div>
                    <ChartBarIcon />
                </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200">
                {submissions.length > 0 && (
                     <div className="mb-8">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Weakest Areas</h3>
                         {analyticsData.missedQuestions.length > 0 ? (
                            <div className="space-y-3">
                                {analyticsData.missedQuestions.map(([question, count]) => (
                                    <div key={question} className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex items-start">
                                        <ExclamationIcon />
                                        <div>
                                            <p className="text-amber-800 font-semibold">{question}</p>
                                            <p className="text-amber-700 text-sm">{count} student(s) answered this incorrectly.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 bg-slate-50 p-4 rounded-lg text-center">No common weak areas found. Great job, class!</p>
                        )}
                    </div>
                )}
               
                <h3 className="text-xl font-bold text-slate-800 mb-4">Student Submissions</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                           {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No submissions yet.</td>
                                </tr>
                           ) : (
                             [...submissions]
                                .sort((a, b) => b.results.scorePercentage - a.results.scorePercentage)
                                .map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{sub.studentName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-bold">{sub.results.scorePercentage.toFixed(0)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                                    </tr>
                                ))
                           )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
