
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, StoredQuiz, StoredSubmission, InputContext } from '../types';
import { getAllUsers, getAllQuizzes, getAllSubmissions, addUser, updateUser, deleteUser } from '../services/storageService';
import { getAdminAnalytics } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { UserForm } from './UserForm';
import { MarkdownReport } from './MarkdownReport';
import { QuizPerformanceChart } from './QuizPerformanceChart';
import { MathRenderer } from './MathRenderer';

const ICONS = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>,
    users: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    analytics: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
};

const StatCard: React.FC<{ title: string, value: number | string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="glass-card p-6 rounded-2xl flex items-center justify-between">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-extrabold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-4 rounded-xl text-white shadow-lg`} style={{ backgroundColor: color }}>{icon}</div>
    </div>
);

type AdminView = 'dashboard' | 'users' | 'analytics';

const DashboardView: React.FC<{ users: User[], quizzes: StoredQuiz[], submissions: StoredSubmission[] }> = ({ users, quizzes, submissions }) => {
    const platformAnalytics = useMemo(() => {
        const avgScores: { title: string, score: number }[] = quizzes.map(quiz => {
            const quizSubmissions = submissions.filter(s => s.quizId === quiz.id);
            if (quizSubmissions.length === 0) return { title: quiz.title, score: 0 };
            const total = quizSubmissions.reduce((acc, s) => acc + s.results.scorePercentage, 0);
            return {
                title: quiz.title,
                score: total / quizSubmissions.length
            };
        });

        const missedCount = new Map<string, number>();
        submissions.forEach(sub => {
            sub.results.mcqResults.forEach(res => {
                if (!res.isCorrect) {
                    missedCount.set(res.question, (missedCount.get(res.question) || 0) + 1);
                }
            });
            sub.results.shortAnswerResults.forEach(res => {
                if (res.score < 3) {
                    missedCount.set(res.question, (missedCount.get(res.question) || 0) + 1);
                }
            });
        });

        const topMissed = Array.from(missedCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        return { avgScores, topMissed };
    }, [quizzes, submissions]);

    return (
        <div className="space-y-8 animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={users.length} icon={ICONS.users} color="#6366f1" />
                <StatCard title="Active Quizzes" value={quizzes.length} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>} color="#0ea5e9" />
                <StatCard title="Submissions" value={submissions.length} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V21c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h7.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V6.5L15.5 2z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>} color="#ec4899" />
            </div>

            <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Platform Performance</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <QuizPerformanceChart data={platformAnalytics.avgScores} />
                    <div>
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Most Missed Questions</h4>
                        {platformAnalytics.topMissed.length > 0 ? (
                            <ul className="space-y-4">
                                {platformAnalytics.topMissed.map(([question, count], index) => (
                                    <li key={index} className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-red-500 mt-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            </span>
                                            <div>
                                                 <p className="text-sm text-slate-700 font-semibold line-clamp-2"><MathRenderer text={question} /></p>
                                                 <p className="text-xs text-red-600 mt-1 font-medium">{count} failures recorded</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center">
                                <p className="text-emerald-700 font-medium">All clear! No significant failure patterns detected.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const loadUsers = useCallback(() => setUsers(getAllUsers()), []);
    useEffect(() => { loadUsers() }, [loadUsers]);
    
    const handleAdd = (userData: User) => {
        addUser({ name: userData.name, email: userData.email, role: userData.role, institution: 'State University' });
        loadUsers();
        setView('list');
    };
    const handleUpdate = (userData: User) => {
        updateUser(userData);
        loadUsers();
        setView('list');
    };
    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUser(userId);
            loadUsers();
        }
    };

    if (view === 'add') return <UserForm onSubmit={handleAdd} onCancel={() => setView('list')} />;
    if (view === 'edit') return <UserForm onSubmit={handleUpdate} onCancel={() => setView('list')} initialUser={selectedUser} />;

    return (
        <div className="glass-card p-8 rounded-3xl animate-enter">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800">User Directory</h3>
                <button onClick={() => setView('add')} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all text-sm flex items-center gap-2">
                    <span>+</span> Add User
                </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">User Info</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                       {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.role === 'admin' ? 'bg-purple-500' : user.role === 'teacher' ? 'bg-indigo-500' : 'bg-teal-500'}`}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-extrabold rounded-full uppercase tracking-wide border ${
                                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                        user.role === 'teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                        'bg-teal-50 text-teal-700 border-teal-100'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setSelectedUser(user); setView('edit'); }} className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded hover:bg-indigo-50 transition-colors">Edit</button>
                                    <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AnalyticsView: React.FC<{ quizzes: StoredQuiz[], submissions: StoredSubmission[] }> = ({ quizzes, submissions }) => {
    const [reportData, setReportData] = useState<{ report: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true); setError(null); setReportData(null);
        try {
            const data = await getAdminAnalytics(quizzes, submissions);
            setReportData(data);
        } catch (err)
            {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card p-8 rounded-3xl animate-enter min-h-[500px]">
             <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800">Institutional Report</h3>
                <p className="text-slate-500 mt-2">Deploy an AI agent to generate deep strategic insights.</p>
            </div>
            {error && <p className="text-red-500 bg-red-50 p-4 rounded-xl mb-6 border border-red-100">{error}</p>}
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <LoadingSpinner text="Analyzing institutional data..." />
                </div>
            ) : reportData ? <MarkdownReport reportPoints={reportData.report} />
            : (
                <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-3xl">📊</div>
                    <h4 className="text-lg font-bold text-slate-700 mb-2">No Report Generated</h4>
                    <p className="text-slate-500 max-w-sm text-center mb-8">Analyze all data points to uncover trends, identify weak areas, and receive actionable recommendations.</p>
                    <button onClick={handleGenerate} className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl hover:bg-indigo-600 hover:shadow-indigo-200 transition-all transform hover:-translate-y-1">
                        <span>✨</span> Generate AI Report
                    </button>
                </div>
            )}
        </div>
    );
};

export const AdminDashboard: React.FC = () => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const [quizzes, setQuizzes] = useState<StoredQuiz[]>([]);
    const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        setQuizzes(getAllQuizzes());
        setSubmissions(getAllSubmissions());
        setUsers(getAllUsers());
    }, []);
    
    const NavItem: React.FC<{ view: AdminView, label: string, icon: React.ReactNode }> = ({ view, label, icon }) => (
        <button 
            onClick={() => setActiveView(view)} 
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                activeView === view 
                ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-900/10 transform scale-105' 
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pb-12">
            {/* Modern Sidebar */}
            <aside className="md:w-72 flex-shrink-0">
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl sticky top-24 min-h-[500px] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/50 to-slate-900 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10 px-2">
                             <div className="p-2 bg-indigo-500 rounded-lg text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                             </div>
                             <h2 className="text-xl font-bold text-white font-[Outfit]">Admin Console</h2>
                        </div>
                        
                        <nav className="space-y-3">
                            <NavItem view="dashboard" label="Overview" icon={ICONS.dashboard} />
                            <NavItem view="users" label="User Directory" icon={ICONS.users} />
                            <NavItem view="analytics" label="AI Intelligence" icon={ICONS.analytics} />
                        </nav>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-xs text-slate-400 font-mono mb-1">System Status</p>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span className="text-sm font-bold text-white">Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                {activeView === 'dashboard' && <DashboardView users={users} quizzes={quizzes} submissions={submissions} />}
                {activeView === 'users' && <UserManagementView />}
                {activeView === 'analytics' && <AnalyticsView quizzes={quizzes} submissions={submissions} />}
            </main>
        </div>
    );
};
