
import React from 'react';
import type { StoredSubmission } from '../types';
import { getQuizById } from '../services/storageService';

interface ProgressChartProps {
    submissions: StoredSubmission[];
}

const getQuizTitle = (quizId: string): string => {
    const quiz = getQuizById(quizId);
    if (!quiz) return 'Unknown Quiz';
    return quiz.title;
};


export const ProgressChart: React.FC<ProgressChartProps> = ({ submissions }) => {
    if (submissions.length < 2) {
        return (
            <div className="w-full h-64 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
                <h4 className="text-sm font-bold text-slate-600 mb-2">Recent Quiz Performance</h4>
                <p className="text-slate-500 text-sm">Complete at least two quizzes to see your progress chart.</p>
            </div>
        );
    }

    // Show latest 5 quizzes for clarity, in chronological order
    const recentSubmissions = submissions.slice(0, 5).reverse();
    
    const width = 500;
    const height = 200;
    const padding = 50;
    const xAxisLabelPadding = 25;

    const points = recentSubmissions.map((sub, index) => {
        const x = padding + (index / (recentSubmissions.length - 1)) * (width - 2 * padding);
        const y = (height - padding) - (sub.results.scorePercentage / 100) * (height - padding - 10); // 10 is top padding
        return { x, y, score: sub.results.scorePercentage, quizId: sub.quizId };
    });

    const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

    return (
        <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col items-center">
            <h4 className="text-sm font-bold text-slate-600 mb-2">Recent Quiz Performance</h4>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis labels and grid lines */}
                {[0, 25, 50, 75, 100].map(val => {
                    const y = (height - padding) - (val / 100) * (height - padding - 10);
                    return (
                        <g key={val}>
                            <text x={padding - 12} y={y + 4} textAnchor="end" className="text-xs fill-slate-500">
                                {val}%
                            </text>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} className="stroke-slate-200" strokeDasharray="2,2"/>
                        </g>
                    );
                })}
                
                {/* X-axis labels */}
                {points.map((p, index) => (
                     <text key={index} x={p.x} y={height - padding + xAxisLabelPadding} textAnchor="middle" className="text-xs fill-slate-500">
                        {getQuizTitle(recentSubmissions[index].quizId).substring(0, 10) + (getQuizTitle(recentSubmissions[index].quizId).length > 10 ? '..' : '')}
                    </text>
                ))}

                {/* Line */}
                <path d={pathD} fill="none" className="stroke-sky-500" strokeWidth="2.5" />
                
                {/* Points and Tooltips */}
                {points.map((p, index) => (
                    <g key={index} className="group cursor-pointer">
                         <circle cx={p.x} cy={p.y} r="5" className="fill-white stroke-2 stroke-sky-500" />
                         <circle cx={p.x} cy={p.y} r="10" className="fill-sky-500 opacity-0 group-hover:opacity-20 transition-opacity" />
                         
                         {/* Tooltip */}
                         <g transform={`translate(${p.x}, ${p.y - 12})`} className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             <rect x="-35" y="-25" width="70" height="20" rx="4" className="fill-slate-800" />
                             <text x="0" y="-12" textAnchor="middle" className="text-xs fill-white font-bold">
                                 {p.score.toFixed(0)}%
                             </text>
                             <polygon points="0,0 -5,-5 5,-5" className="fill-slate-800" transform="translate(0, -5)" />
                         </g>
                    </g>
                ))}
            </svg>
        </div>
    );
};
