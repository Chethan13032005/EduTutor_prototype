
import React, { useState, useEffect, useCallback } from 'react';
import type { StoredQuiz, StoredSubmission } from '../types';
import { getAllQuizzes, getSubmissionsForStudent, getStudentStats } from '../services/storageService';
import { useAppContext } from '../hooks/useAppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Learning Velocity Chart (Styled) ---
const LearningVelocityChart: React.FC<{ submissions: StoredSubmission[] }> = ({ submissions }) => {
    if (submissions.length < 2) return (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed">
            <span className="text-4xl mb-2 opacity-50">📈</span>
            <p className="text-sm font-medium">Take at least 2 quizzes to track velocity!</p>
        </div>
    );

    const recent = submissions.slice(0, 5).reverse(); 
    const scores = recent.map(s => s.results.scorePercentage);
    
    const width = 600; 
    const height = 200;
    const padding = 20;
    const maxScore = 100;

    const points = scores.map((score, i) => {
        const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
        const y = height - padding - (score / maxScore) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-full overflow-hidden relative group">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Grid */}
                <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e2e8f0" strokeDasharray="6" strokeWidth="1" />
                <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#cbd5e1" strokeWidth="1" />
                
                {/* Line & Area */}
                <path d={`M${padding},${height-padding} L${points.split(' ')[0]} ${points} L${width-padding},${height-padding} Z`} fill="url(#lineGradient)" />
                <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data Points */}
                {scores.map((score, i) => {
                     const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
                     const y = height - padding - (score / maxScore) * (height - 2 * padding);
                     return (
                        <g key={i} className="group/point">
                            <circle cx={x} cy={y} r="6" fill="white" stroke="#6366f1" strokeWidth="3" className="transition-all duration-300 group-hover/point:r-8" />
                            <foreignObject x={x - 20} y={y - 40} width="40" height="30">
                                <div className="flex justify-center items-center h-full">
                                    <span className="text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover/point:opacity-100 transition-opacity duration-200">
                                        {Math.round(score)}
                                    </span>
                                </div>
                            </foreignObject>
                        </g>
                     );
                })}
            </svg>
        </div>
    );
};


export const StudentDashboard: React.FC = () => {
    const { currentUser: student, takeQuiz, viewSubmission } = useAppContext();
    const [availableQuizzes, setAvailableQuizzes] = useState<StoredQuiz[]>([]);
    const [mySubmissions, setMySubmissions] = useState<StoredSubmission[]>([]);
    const [stats, setStats] = useState<any>(null);

    const loadData = useCallback(() => {
        if (!student) return;
        const allQuizzes = getAllQuizzes();
        const studentSubmissions = getSubmissionsForStudent(student.id);
        setMySubmissions(studentSubmissions.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));

        const takenQuizIds = new Set(studentSubmissions.map(s => s.quizId));
        setAvailableQuizzes(allQuizzes.filter(q => !takenQuizIds.has(q.id)));
        
        setStats(getStudentStats(student.id));
    }, [student]);

    useEffect(() => { loadData(); }, [loadData]);

    const generatePDFReport = () => {
        if (!student || !stats) return;

        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(79, 70, 229); // Indigo
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('EduTutor Student Performance Report', 15, 20);

        // Student Info
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${student.name}`, 15, 45);
        doc.text(`Email: ${student.email}`, 15, 52);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 59);

        // Stats Summary
        doc.setFillColor(243, 244, 246);
        doc.rect(130, 40, 65, 30, 'F');
        doc.setFontSize(10);
        doc.text(`Current Rank: #${stats.rank} (Top ${Math.max(1, 100 - stats.percentile)}%)`, 135, 48);
        doc.text(`Average Score: ${stats.avgScore}%`, 135, 55);
        doc.text(`Total XP: ${student.xp || 0}`, 135, 62);

        // Weakest Topic
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Focus Area:', 15, 75);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(stats.weakestTopic, 45, 75);

        // Strengths & Weaknesses (Aggregated)
        const allStrengths = new Set<string>();
        const allWeaknesses = new Set<string>();
        mySubmissions.forEach(sub => {
            sub.results.strengths?.forEach(s => allStrengths.add(s));
            sub.results.topicsToStudy?.forEach(w => allWeaknesses.add(w));
        });

        const strengthsList = Array.from(allStrengths).slice(0, 5);
        const weaknessList = Array.from(allWeaknesses).slice(0, 5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(21, 128, 61); // Green
        doc.text('Key Strengths:', 15, 90);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        strengthsList.forEach((s, i) => doc.text(`• ${s}`, 15, 96 + (i*5)));

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red
        doc.text('Areas for Improvement:', 110, 90);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        weaknessList.forEach((w, i) => doc.text(`• ${w}`, 110, 96 + (i*5)));

        // History Table
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('Assessment History', 15, 130);

        const tableData = mySubmissions.map(sub => {
            const quiz = getAllQuizzes().find(q => q.id === sub.quizId);
            const title = quiz ? quiz.title : 'Unknown Quiz';
            return [
                new Date(sub.submittedAt).toLocaleDateString(),
                title,
                `${sub.results.scorePercentage}%`,
                sub.results.scorePercentage >= 80 ? 'Excellent' : sub.results.scorePercentage >= 60 ? 'Good' : 'Needs Work'
            ];
        });

        autoTable(doc, {
            startY: 135,
            head: [['Date', 'Quiz Title', 'Score', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });

        doc.save(`EduTutor_Report_${student.name.replace(' ', '_')}.pdf`);
    };
    
    if (!student || !stats) return null;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-enter pb-12">
            
            {/* 👋 Personalized Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 transition-all duration-1000"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                
                {/* Abstract Shapes */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-400 opacity-20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-6 max-w-2xl">
                        <div>
                             <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold text-indigo-50 mb-3 uppercase tracking-wider">Student Portal</span>
                            <h1 className="text-4xl md:text-5xl font-extrabold font-[Outfit] text-white tracking-tight leading-tight">
                                Welcome back, <br/> {student.name.split(' ')[0]}! 👋
                            </h1>
                        </div>
                        <p className="text-indigo-100 text-lg leading-relaxed font-light">
                            You are performing better than <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">{stats.percentile}%</span> of your class. 
                            Keep pushing your limits!
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => availableQuizzes[0] && takeQuiz(availableQuizzes[0])} className="bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2">
                                <span className="text-xl">⚡</span> Take a Quiz
                            </button>
                            <button onClick={generatePDFReport} className="bg-indigo-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-900/60 transition-all flex items-center gap-2">
                                <span className="text-xl">📊</span> Download Report
                            </button>
                        </div>
                    </div>

                    {/* Rank Card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl text-center min-w-[180px] shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-3">Class Rank</p>
                        <div className="relative inline-block">
                            <span className="text-7xl font-extrabold font-[Outfit] text-white drop-shadow-lg">#{stats.rank}</span>
                            <div className="absolute -top-2 -right-4 text-2xl animate-bounce">👑</div>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-indigo-900/50 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-300 to-emerald-400" style={{width: `${stats.percentile}%`}}></div>
                        </div>
                        <p className="text-xs text-indigo-100 mt-2 font-medium">Top {Math.max(1, 100 - stats.percentile)}%</p>
                    </div>
                </div>
            </div>

            {/* 📈 Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Badge Card */}
                <div className="glass-card p-6 rounded-3xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Badge</span>
                    </div>
                    <div className="flex items-end gap-2 mb-2">
                        <h3 className="text-3xl font-extrabold text-slate-800">{stats.badge}</h3>
                        <span className="text-3xl mb-1">{stats.badge === 'Diamond' ? '💎' : stats.badge === 'Gold' ? '🏆' : stats.badge === 'Silver' ? '🥈' : '🥉'}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full" style={{width: `${(student.xp || 0) % 500 / 5}%`}}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{(student.xp || 0) % 500}/500 XP to Level {(student.level || 1) + 1}</p>
                </div>

                {/* Quizzes Card */}
                <div className="glass-card p-6 rounded-3xl">
                    <div className="flex justify-between items-start mb-4">
                         <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                    </div>
                    <h3 className="text-4xl font-extrabold text-slate-800">{stats.quizzesTaken}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Total Assessments</p>
                </div>

                {/* Avg Score Card */}
                <div className="glass-card p-6 rounded-3xl">
                    <div className="flex justify-between items-start mb-4">
                         <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
                    </div>
                    <h3 className={`text-4xl font-extrabold ${stats.avgScore >= 80 ? 'text-emerald-600' : stats.avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                        {stats.avgScore}%
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Across all subjects</p>
                </div>

                {/* Weakest Topic Card */}
                 <div className="glass-card p-6 rounded-3xl">
                    <div className="flex justify-between items-start mb-4">
                         <div className="p-2 bg-red-100 rounded-xl text-red-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Area</span>
                    </div>
                    <h3 className="text-lg font-bold text-red-600 line-clamp-2 leading-tight min-h-[3.5rem] flex items-center">
                        {stats.weakestTopic}
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 📉 Learning Velocity */}
                <div className="lg:col-span-2 glass-card p-8 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 font-[Outfit]">
                            <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">📈</span> Learning Velocity
                        </h3>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Last 5 Quizzes</span>
                    </div>
                    <div className="h-64 w-full">
                        <LearningVelocityChart submissions={mySubmissions} />
                    </div>
                </div>

                {/* 📚 Recommended Quizzes */}
                <div className="glass-card p-6 rounded-[2rem] flex flex-col h-full">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 font-[Outfit]">
                        <span className="p-2 bg-teal-100 rounded-xl text-teal-600">📚</span> Recommended
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px] custom-scrollbar">
                        {availableQuizzes.length === 0 ? (
                             <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 text-3xl shadow-sm">🎉</div>
                                <p className="text-slate-600 text-sm font-bold">You're all caught up!</p>
                                <p className="text-slate-400 text-xs mt-1">Check back later for new assignments.</p>
                             </div>
                        ) : (
                            availableQuizzes.map(q => (
                                <div key={q.id} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wide ${
                                            q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                            q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {q.difficulty || 'Moderate'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1 text-base">{q.title}</h4>
                                    <p className="text-xs text-slate-400 mb-4 font-medium flex items-center gap-2">
                                        <span>📄 {q.context.type}</span>
                                        <span>•</span>
                                        <span>❓ {(q.quiz.mcqs.length + q.quiz.shortAnswerQuestions.length)} Qs</span>
                                    </p>
                                    <button onClick={() => takeQuiz(q)} className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                                        Start Quiz
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 📝 History Table */}
            <div className="glass-card rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 font-[Outfit]">Recent Activity</h3>
                    <p className="text-sm text-slate-500">View detailed feedback for past assessments.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-8 py-5">Quiz Name</th>
                                <th className="px-6 py-5">Subject</th>
                                <th className="px-6 py-5">Score</th>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {mySubmissions.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No quiz history available yet.</td></tr>
                            ) : (
                                mySubmissions.map(sub => {
                                    const quiz = getAllQuizzes().find(q => q.id === sub.quizId);
                                    const title = quiz ? quiz.title : 'Unknown Quiz';
                                    const subject = quiz ? (quiz.context.type === 'topic' ? 'Topic Based' : 'Material Based') : 'General';
                                    const score = sub.results.scorePercentage;
                                    
                                    return (
                                        <tr key={sub.id} className="hover:bg-white transition-colors group">
                                            <td className="px-8 py-5 font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                {title}
                                            </td> 
                                            <td className="px-6 py-5">
                                                <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">{subject}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                            <path className={`${score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`} strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                                        </svg>
                                                        <span className="absolute text-[10px] font-bold text-slate-700">{Math.round(score)}%</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-medium text-slate-500">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-5 text-right">
                                                <button onClick={() => viewSubmission(sub)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1 ml-auto">
                                                    View Analysis <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
