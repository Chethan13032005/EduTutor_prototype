import React, { createContext, useState, useCallback, useEffect } from 'react';
import { AppState } from '../types';
import type { User, StoredQuiz, UserAnswers, GradedResults, Quiz, StoredSubmission } from '../types';
import { gradeQuiz } from '../services/geminiService';
import { saveSubmission, getAllUsers } from '../services/storageService';

interface AppContextType {
    appState: AppState;
    currentUser: User | null;
    currentQuiz: StoredQuiz | null;
    results: GradedResults | null;
    error: string | null;
    users: User[];
    isLoadingApp: boolean;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    takeQuiz: (quiz: StoredQuiz) => void;
    submitQuiz: (quiz: Quiz, answers: UserAnswers) => Promise<void>;
    viewSubmission: (submission: StoredSubmission) => void;
    startTutorSession: () => void;
    startTeacherHelper: () => void;
    backToDashboard: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentQuiz, setCurrentQuiz] = useState<StoredQuiz | null>(null);
    const [results, setResults] = useState<GradedResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingApp, setIsLoadingApp] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        // Data is now seeded automatically by storageService on first load.
        // This call ensures the component state is synchronized with localStorage.
        setUsers(getAllUsers());
        setIsLoadingApp(false);
    }, []);

    const login = useCallback((user: User) => {
        setCurrentUser(user);
        setError(null);
        switch (user.role) {
            case 'admin': setAppState(AppState.ADMIN_DASHBOARD); break;
            case 'teacher': setAppState(AppState.TEACHER_DASHBOARD); break;
            case 'student': setAppState(AppState.STUDENT_DASHBOARD); break;
        }
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        setAppState(AppState.LOGIN);
        setCurrentQuiz(null);
        setResults(null);
        setError(null);
        setUsers(getAllUsers());
    }, []);

    const takeQuiz = useCallback((quiz: StoredQuiz) => {
        setCurrentQuiz(quiz);
        setAppState(AppState.TAKING_QUIZ);
    }, []);

    // Allows viewing past results without re-taking or re-grading
    const viewSubmission = useCallback((submission: StoredSubmission) => {
        setResults(submission.results);
        setAppState(AppState.RESULTS);
    }, []);
    
    const startTutorSession = useCallback(() => {
        if(currentUser?.role === 'student') setAppState(AppState.STUDENT_AI_TUTOR);
    }, [currentUser]);

    const startTeacherHelper = useCallback(() => {
        if(currentUser?.role === 'teacher') setAppState(AppState.TEACHER_AI_HELPER);
    }, [currentUser]);

    const backToDashboard = useCallback(() => {
        if (!currentUser) { logout(); return; }
        switch (currentUser.role) {
            case 'admin': setAppState(AppState.ADMIN_DASHBOARD); break;
            case 'teacher': setAppState(AppState.TEACHER_DASHBOARD); break;
            case 'student': setAppState(AppState.STUDENT_DASHBOARD); break;
        }
        setCurrentQuiz(null);
        setResults(null);
        setError(null);
    }, [currentUser, logout]);

    const submitQuiz = useCallback(async (quiz: Quiz, answers: UserAnswers) => {
        if (!currentQuiz || !currentUser) return;
        setAppState(AppState.GRADING);
        setError(null);
        try {
            const gradedData = await gradeQuiz(quiz, answers);
            const fullResults: GradedResults = {
                ...gradedData,
                mcqResults: gradedData.mcqResults.map((res: any) => ({
                    ...quiz.mcqs.find(q => q.id === res.id)!, ...res, userAnswerIndex: answers[res.id]
                })),
                shortAnswerResults: gradedData.shortAnswerResults.map((res: any) => ({
                    ...quiz.shortAnswerQuestions.find(q => q.id === res.id)!, ...res, userAnswer: answers[res.id]
                })),
            };
            setResults(fullResults);
            saveSubmission(currentQuiz.id, currentUser.id, currentUser.name, fullResults);
            setAppState(AppState.RESULTS);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown grading error occurred.");
            setAppState(AppState.TAKING_QUIZ);
        }
    }, [currentQuiz, currentUser]);

    const value = {
        appState, currentUser, currentQuiz, results, error, users, isLoadingApp, isLoading,
        login, logout, takeQuiz, submitQuiz, viewSubmission, startTutorSession, startTeacherHelper, backToDashboard
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};