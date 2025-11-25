import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { analyzeContent } from '../services/geminiService';
import { useAppContext } from '../hooks/useAppContext';
import { MathRenderer } from './MathRenderer';


const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const TeacherAIHelper: React.FC = () => {
    const { backToDashboard } = useAppContext();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);

    const historyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, [history]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setHistory([]); 
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setFilePreview(reader.result as string);
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !file || isLoading) return;

        const userMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'user', text: userInput.trim() };
        setHistory(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);

        const thinkingMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'model', text: '', isThinking: true };
        setHistory(prev => [...prev, thinkingMessage]);

        try {
            const responseText = await analyzeContent(userMessage.text, file);
            const modelMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'model', text: responseText };
            setHistory(prev => prev.slice(0, -1).concat(modelMessage));
        } catch (error) {
            console.error("Analysis error:", error);
            const errorMessage: ChatMessage = { id: crypto.randomUUID(), sender: 'system', text: 'Sorry, I encountered an error during analysis. Please try again.' };
            setHistory(prev => prev.slice(0, -1).concat(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col">
            <header className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={backToDashboard} className="p-2 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
                    <h2 className="text-xl font-bold text-slate-800">AI Content Assistant</h2>
                </div>
            </header>
            
            <div ref={historyRef} className="flex-1 overflow-y-auto p-6">
                {!file ? (
                    <div className="h-full flex flex-col justify-center items-center text-center">
                        <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-100">
                           <UploadIcon />
                           <p className="mt-1 text-sm text-slate-600">Click to upload an image or .txt file to begin.</p>
                           <input id="file-upload" type="file" className="hidden" accept="image/*,.txt" onChange={handleFileChange} />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                         {history.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'model' && <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0"></div>}
                                <div className={`max-w-xl p-4 rounded-2xl ${
                                    msg.sender === 'user' ? 'bg-teal-600 text-white rounded-br-none' :
                                    msg.sender === 'model' ? 'bg-slate-100 text-slate-800 rounded-bl-none' :
                                    'bg-transparent text-slate-500 text-center w-full text-sm italic'
                                }`}>
                                    {msg.isThinking ? 
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div> : 
                                        <div className="prose prose-sm max-w-none"><MathRenderer text={msg.text} /></div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className="p-4 border-t border-slate-200">
                {file && (
                     <div className="flex items-center gap-3 mb-3 p-2 bg-slate-100 rounded-lg">
                        {filePreview && <img src={filePreview} alt="Preview" className="w-10 h-10 rounded-md object-cover" />}
                        <p className="text-sm text-slate-700 font-medium truncate flex-1">{file.name}</p>
                         <button onClick={() => { setFile(null); setFilePreview(null); setHistory([]); }} className="p-1.5 rounded-full hover:bg-slate-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} placeholder={file ? 'Ask about the content... (e.g., "Summarize this")' : 'Please upload a file first'} disabled={!file || isLoading} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>
                    <button type="submit" disabled={!file || !userInput.trim() || isLoading} className="px-5 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-300">Send</button>
                </form>
            </footer>
        </div>
    );
};