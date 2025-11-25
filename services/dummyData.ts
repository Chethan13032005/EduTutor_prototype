
import { User, StoredQuiz, StoredSubmission, InputContext } from '../types';

// NOTE: Storing a File object in localStorage isn't possible as it's not serializable.
// For dummy data, we simulate the context by storing a string representation.
// In the live app, when a file is used, its name would be stored after processing.
const createPlaceholderContext = (type: 'image' | 'document', name: string): InputContext => ({
  type,
  content: { name } as File, // Cast to File to match type, but it's just an object with a name property
});


export const sampleUsers: User[] = [
  { id: 'admin-01', name: 'Dr. Evelyn Reed', email: 'e.reed@school.edu', role: 'admin', institution: 'State University' },
  { id: 'teacher-01', name: 'Prof. Ada Lovelace', email: 'ada@school.edu', role: 'teacher', institution: 'State University' },
  { id: 'teacher-02', name: 'Dr. Marie Curie', email: 'marie@school.edu', role: 'teacher', institution: 'State University' },
  { id: 'student-01', name: 'Charlie Babbage', email: 'charlie@school.edu', role: 'student', institution: 'State University' },
  { id: 'student-02', name: 'Grace Hopper', email: 'grace@school.edu', role: 'student', institution: 'State University' },
  { id: 'student-03', name: 'Alan Turing', email: 'alan@school.edu', role: 'student', institution: 'State University' },
  { id: 'student-04', name: 'Hedy Lamarr', email: 'hedy@school.edu', role: 'student', institution: 'State University' },
  { id: 'student-05', name: 'John von Neumann', email: 'john@school.edu', role: 'student', institution: 'State University' },
];

export const sampleQuizzes: StoredQuiz[] = [];

export const sampleSubmissions: StoredSubmission[] = [];
