import React, { useState } from 'react';
import type { UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';

const RoleCard: React.FC<{ role: UserRole, selectedRole: UserRole | null, onSelect: (role: UserRole) => void }> = ({ role, selectedRole, onSelect }) => {
    const icons = {
        teacher: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="M7 21l5-5 5 5"></path></svg>,
        student: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6"></path><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path></svg>,
        admin: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
    };

    const config = {
        teacher: { 
            active: 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-200 shadow-lg', 
            inactive: 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50',
            iconBg: 'bg-indigo-500'
        },
        student: { 
            active: 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-200 shadow-lg', 
            inactive: 'border-slate-200 hover:border-teal-300 hover:bg-slate-50',
            iconBg: 'bg-teal-500'
        },
        admin: { 
            active: 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-200 shadow-lg', 
            inactive: 'border-slate-200 hover:border-purple-300 hover:bg-slate-50',
            iconBg: 'bg-purple-500'
        }
    };

    const isSelected = selectedRole === role;
    const style = config[role];

    return (
        <button
            type="button"
            onClick={() => onSelect(role)}
            className={`relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 w-full transform ${isSelected ? `${style.active} scale-105` : style.inactive}`}
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 text-white shadow-lg transition-transform duration-300 ${style.iconBg} ${isSelected ? 'rotate-3' : ''}`}>
                {icons[role]}
            </div>
            <h3 className={`font-bold text-sm capitalize font-[Outfit] tracking-wide ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>{role}</h3>
            {isSelected && (
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full ${style.iconBg} text-white flex items-center justify-center shadow-md border-2 border-white`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
            )}
        </button>
    );
};

export const LoginPage: React.FC = () => {
    const { users, login } = useAppContext();
    const [selectedRole, setSelectedRole] = useState<UserRole>('student');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const usersOfSelectedRole = users.filter(u => u.role === selectedRole);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if(selectedUserId) {
            const user = users.find(u => u.id === selectedUserId);
            if(user) login(user);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[650px] animate-enter border border-white/50">
                
                {/* Left Side - Brand & Visuals */}
                <div className="relative bg-slate-900 p-12 flex flex-col justify-between overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 opacity-90"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    {/* Animated Blobs */}
                    <div className="absolute top-10 right-10 w-48 h-48 bg-pink-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-float"></div>
                    <div className="absolute bottom-20 left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-white/95">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <span className="text-xl font-bold tracking-wide font-[Outfit]">EduTutor</span>
                        </div>
                    </div>

                    <div className="relative z-10 my-auto">
                        <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight font-[Outfit] tracking-tight">
                            Master any subject with <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-indigo-200">AI-Powered</span> Tutoring
                        </h1>
                        <p className="text-indigo-100 text-xl max-w-md leading-relaxed font-light">
                            Create quizzes instantly, get reasoning-based feedback, and chat with your personal AI tutor.
                        </p>
                    </div>

                    <div className="relative z-10">
                         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm text-sm text-indigo-100">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            System Operational • Gemini 2.5 Active
                         </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="p-10 sm:p-16 lg:p-20 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
                    <div className="w-full max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-4xl font-bold text-slate-900 font-[Outfit]">Welcome Back</h2>
                            <p className="text-slate-500 mt-3 text-lg">Please select your role to continue.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="grid grid-cols-3 gap-4">
                                {(['student', 'teacher', 'admin'] as UserRole[]).map(role => (
                                    <RoleCard key={role} role={role} selectedRole={selectedRole} onSelect={setSelectedRole} />
                                ))}
                            </div>

                            <div className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div>
                                    <label htmlFor="profile" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Select Profile (Demo)</label>
                                    <div className="relative group">
                                        <select
                                            id="profile"
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            className="block w-full pl-4 pr-10 py-4 text-base border-2 border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm rounded-xl bg-slate-50 hover:bg-white hover:border-slate-300 transition-all appearance-none cursor-pointer font-medium text-slate-700"
                                        >
                                            <option value="" disabled>Choose a profile...</option>
                                            {usersOfSelectedRole.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 group-hover:text-indigo-600 transition-colors">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!selectedUserId}
                                    className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-slate-900 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <span>Sign In to Dashboard</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};