import React from 'react';

interface ChartData {
    title: string;
    score: number;
}

interface QuizPerformanceChartProps {
    data: ChartData[];
}

export const QuizPerformanceChart: React.FC<QuizPerformanceChartProps> = ({ data }) => {
    if (data.length === 0) {
        return <p className="text-slate-500 text-center py-8">No quiz data available to display.</p>;
    }

    const maxValue = 100;

    return (
        <div>
            <h4 className="text-lg font-semibold text-slate-700 mb-4">Average Score by Quiz</h4>
            <div className="flex justify-around items-end h-64 bg-slate-50 p-4 rounded-lg border border-slate-200 space-x-2">
                {data.map((item, index) => {
                    const barHeight = item.score > 0 ? (item.score / maxValue) * 100 : 0;
                    const scoreColor = item.score >= 80 ? 'bg-teal-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500';

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                            <div className="text-sm font-bold text-slate-800 mb-1">{item.score.toFixed(0)}%</div>
                            <div
                                className={`w-3/4 max-w-[50px] rounded-t-md ${scoreColor} transition-all duration-500 ease-out`}
                                style={{ height: `${barHeight}%` }}
                            ></div>
                            <div className="text-xs text-slate-500 mt-2 text-center break-words w-full">{item.title}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
