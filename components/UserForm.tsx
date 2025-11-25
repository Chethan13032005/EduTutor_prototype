import React, { useState, useEffect } from 'react';
import type { User, UserFormData, UserRole } from '../types';

interface UserFormProps {
    onSubmit: (userData: User) => void;
    onCancel: () => void;
    initialUser?: User | null;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, initialUser }) => {
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        role: 'student',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialUser) {
            setFormData({
                name: initialUser.name,
                email: initialUser.email,
                role: initialUser.role,
            });
        }
    }, [initialUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Name and Email cannot be empty.');
            return;
        }
        setError('');
        
        const userToSubmit: User = {
            ...(initialUser || { id: '', institution: 'State University' }), // Preserve id and institution if editing
            ...formData,
        };
        
        onSubmit(userToSubmit);
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">
                {initialUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {initialUser ? 'Save Changes' : 'Add User'}
                    </button>
                </div>
            </form>
        </div>
    );
};