import React from 'react';
import { MathRenderer } from './MathRenderer';

interface MarkdownReportProps {
    reportPoints: string[];
}

const InsightIcons: React.FC<{ type: 'strength' | 'weakness' | 'trend' | 'recommendation' }> = ({ type }) => {
    const icons = {
        strength: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
        weakness: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
        trend: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
        recommendation: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    };
    const titles = { strength: 'Key Strength', weakness: 'Key Weakness', trend: 'Observed Trend', recommendation: 'Recommendation' };

    return (
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg mr-4">
            {icons[type]}
        </div>
    );
};


export const MarkdownReport: React.FC<MarkdownReportProps> = ({ reportPoints }) => {
    const insights = [
        { type: 'strength', text: reportPoints[0] },
        { type: 'weakness', text: reportPoints[1] },
        { type: 'trend', text: reportPoints[2] },
        { type: 'recommendation', text: reportPoints[3] },
    ] as const;

    return (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">AI-Generated Key Insights</h3>
            <div className="space-y-4">
                {insights.map((insight, index) => (
                    <div key={index} className="flex items-start bg-white p-4 rounded-lg border border-slate-200">
                        <InsightIcons type={insight.type} />
                        <div>
                            <h4 className="font-semibold text-slate-800">
                                {{
                                    strength: 'Key Strength',
                                    weakness: 'Key Weakness',
                                    trend: 'Observed Trend',
                                    recommendation: 'Recommendation'
                                }[insight.type]}
                            </h4>
                            <div className="text-slate-600 prose prose-sm max-w-none">
                                <MathRenderer text={insight.text} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
