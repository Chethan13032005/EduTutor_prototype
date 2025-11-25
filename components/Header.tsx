import React from 'react';
import { useAppContext } from '../hooks/useAppContext';

export const Header: React.FC = () => {
    const { currentUser: user, logout } = useAppContext();

    return (
        <header className="w-full glass-panel sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-18 py-3">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                            <div className="relative bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 font-[Outfit]">
                            Edu<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Tutor</span>
                        </h1>
                    </div>

                    {user && (
                        <div className="flex items-center gap-4 sm:gap-6">
                             {/* Gamification Stats for Student */}
                            {user.role === 'student' && (
                                <div className="hidden sm:flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                    <div className="flex flex-col items-end leading-none">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level {user.level || 1}</span>
                                        <span className="text-sm font-extrabold text-indigo-600">{user.xp || 0} XP</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-300 to-orange-400 flex items-center justify-center shadow-inner text-white text-xs font-bold">
                                        ⚡
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight">{user.name}</p>
                                    <div className="flex items-center justify-end gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-purple-500' : user.role === 'teacher' ? 'bg-indigo-500' : 'bg-teal-500'}`}></span>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{user.role}</p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={logout}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                                    title="Logout"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};