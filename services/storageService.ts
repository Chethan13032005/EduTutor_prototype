
import type { StoredQuiz, StoredSubmission, Quiz, GradedResults, InputContext, User, UserFormData } from '../types';
import { sampleUsers, sampleQuizzes, sampleSubmissions } from './dummyData';

const USERS_KEY = 'edututor_users';
const QUIZZES_KEY = 'edututor_quizzes';
const SUBMISSIONS_KEY = 'edututor_submissions';

const initializeData = <T,>(key: string, sampleData: T[]): T[] => {
    try {
        const dataJson = localStorage.getItem(key);
        // FIX: Only seed if data is null (key doesn't exist). 
        // If dataJson is "[]", that is valid data (user deleted everything), do not re-seed.
        if (dataJson === null) {
            localStorage.setItem(key, JSON.stringify(sampleData));
            return sampleData;
        }
        return JSON.parse(dataJson);
    } catch (error) {
        console.error(`Failed to initialize data for key "${key}":`, error);
        // Fallback only on crash
        return sampleData;
    }
};

// --- User Management ---
export const getAllUsers = (): User[] => {
    const users = initializeData<User>(USERS_KEY, sampleUsers);
    // Initialize XP and Level for existing users if missing
    return users.map(u => ({
        ...u,
        xp: u.xp || 0,
        level: u.level || 1
    }));
};

export const getUserById = (userId: string): User | null => {
    const users = getAllUsers();
    return users.find(u => u.id === userId) || null;
}

export const addUser = (userData: Omit<User, 'id'>): User => {
    const users = getAllUsers();
    const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        xp: 0,
        level: 1
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
};

export const updateUser = (updatedUser: User): User => {
    let users = getAllUsers();
    users = users.map(user => (user.id === updatedUser.id ? updatedUser : user));
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return updatedUser;
};

export const deleteUser = (userId: string): void => {
    let users = getAllUsers();
    const admins = users.filter(u => u.role === 'admin');
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin' && admins.length <= 1) {
        alert("Error: Cannot delete the last remaining admin account.");
        return;
    }
    users = users.filter(user => user.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- Quiz Management ---

export const getAllQuizzes = (): StoredQuiz[] => {
    return initializeData<StoredQuiz>(QUIZZES_KEY, sampleQuizzes);
};

export const getQuizById = (quizId: string): StoredQuiz | null => {
    const quizzes = getAllQuizzes();
    return quizzes.find(q => q.id === quizId) || null;
};

export const saveQuiz = (quiz: Quiz, context: InputContext, teacherId: string): StoredQuiz => {
    const quizzes = getAllQuizzes();
    const storableContext = { ...context };
    if (storableContext.content instanceof File) {
        storableContext.content = `File: ${storableContext.content.name}`;
    }

    // Use the title from the AI generated quiz, or fallback to context description
    let finalTitle = quiz.title;
    if (!finalTitle) {
        // Fallback logic if AI didn't generate title (shouldn't happen with new schema)
         switch (context.type) {
            case 'topic': finalTitle = context.content as string; break;
            case 'text': finalTitle = 'Text Assessment'; break;
            default: finalTitle = 'Generated Quiz'; break;
        }
    }

    const newQuiz: StoredQuiz = {
        id: crypto.randomUUID().substring(0, 6).toUpperCase(),
        teacherId,
        title: finalTitle,
        quiz,
        context: storableContext,
        createdAt: new Date().toISOString(),
        difficulty: 'Moderate' // Default fallback
    };
    quizzes.push(newQuiz);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
    return newQuiz;
};

export const updateQuiz = (quizId: string, updatedQuizData: Quiz): void => {
    const quizzes = getAllQuizzes();
    const index = quizzes.findIndex(q => q.id === quizId);
    if (index !== -1) {
        quizzes[index].quiz = updatedQuizData;
        localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
    }
};

export const deleteQuiz = (quizId: string): void => {
    // 1. Remove the Quiz
    let quizzes = getAllQuizzes();
    const updatedQuizzes = quizzes.filter(q => q.id !== quizId);
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(updatedQuizzes));

    // 2. Remove associated Submissions (Clean up orphaned data to prevent errors in analytics)
    let submissions = getAllSubmissions();
    const updatedSubmissions = submissions.filter(s => s.quizId !== quizId);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubmissions));
};


// --- Submission Management & Gamification ---

export const getAllSubmissions = (): StoredSubmission[] => {
    return initializeData<StoredSubmission>(SUBMISSIONS_KEY, sampleSubmissions);
}

export const getSubmissionsForQuiz = (quizId: string): StoredSubmission[] => {
    const allSubmissions = getAllSubmissions();
    return allSubmissions.filter(s => s.quizId === quizId);
};

export const getSubmissionsForStudent = (studentId: string): StoredSubmission[] => {
    const allSubmissions = getAllSubmissions();
    return allSubmissions.filter(s => s.studentId === studentId);
}

export const saveSubmission = (quizId: string, studentId: string, studentName: string, results: GradedResults): StoredSubmission => {
    const allSubmissions = getAllSubmissions();
    
    const newSubmission: StoredSubmission = {
        id: crypto.randomUUID(),
        quizId,
        studentId,
        studentName,
        results,
        submittedAt: new Date().toISOString(),
    };

    allSubmissions.push(newSubmission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(allSubmissions));

    // --- Gamification Logic ---
    const users = getAllUsers();
    const studentIndex = users.findIndex(u => u.id === studentId);
    
    if (studentIndex !== -1) {
        const student = users[studentIndex];
        
        // XP Calculation: 50 XP base for completing + 1 XP per percentage point
        const earnedXP = 50 + Math.round(results.scorePercentage);
        const currentXP = student.xp || 0;
        const newXP = currentXP + earnedXP;
        
        // Level Calculation: Level up every 500 XP
        // Level 1: 0-499, Level 2: 500-999, etc.
        const newLevel = Math.floor(newXP / 500) + 1;

        student.xp = newXP;
        student.level = newLevel;
        
        users[studentIndex] = student;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return newSubmission;
};

// --- Analytics Helpers ---

export const getStudentStats = (studentId: string) => {
    const allSubmissions = getSubmissionsForStudent(studentId);
    
    // 1. Current Badge (Based on Highest Score Achieved)
    let badge = 'Bronze';
    if (allSubmissions.length > 0) {
        const maxScore = Math.max(...allSubmissions.map(s => s.results.scorePercentage));
        if (maxScore === 100) badge = 'Diamond';
        else if (maxScore >= 80) badge = 'Gold';
        else if (maxScore >= 60) badge = 'Silver';
    }

    // 2. Average Score
    const avgScore = allSubmissions.length > 0 
        ? allSubmissions.reduce((acc, s) => acc + s.results.scorePercentage, 0) / allSubmissions.length
        : 0;

    // 3. Weakest Topic
    // Aggregates all 'topicsToStudy' from past results
    const topicCounts: Record<string, number> = {};
    allSubmissions.forEach(s => {
        if (s.results.topicsToStudy) {
            s.results.topicsToStudy.forEach(topic => {
                topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            });
        }
    });
    // Sort by frequency desc
    const weakestTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

    // 4. Rank & Percentile Calculation
    const allUsers = getAllUsers().filter(u => u.role === 'student');
    const allSubmissionsGlobal = getAllSubmissions();

    // Calculate average score for every student
    const studentAverages = allUsers.map(u => {
        const subs = allSubmissionsGlobal.filter(s => s.studentId === u.id);
        if (subs.length === 0) return { id: u.id, avg: 0 }; // Default 0 if no quizzes
        const sum = subs.reduce((acc, s) => acc + s.results.scorePercentage, 0);
        return { id: u.id, avg: sum / subs.length };
    });

    // Sort descending by average score
    studentAverages.sort((a, b) => b.avg - a.avg);

    // Find current student's rank
    const rankIndex = studentAverages.findIndex(s => s.id === studentId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : allUsers.length; // 1-based rank

    // Calculate Percentile: (Number of people below you / Total people) * 100
    // Or simpler: 100 - ((rank - 1) / total * 100)
    const totalStudents = allUsers.length;
    const percentile = totalStudents > 1 
        ? Math.round(((totalStudents - rank) / totalStudents) * 100)
        : 100; // If only 1 student, they are top 100%

    return {
        badge,
        avgScore: Math.round(avgScore),
        weakestTopic,
        rank,
        percentile: Math.max(percentile, 1), // Ensure at least 1%
        quizzesTaken: allSubmissions.length
    };
};
