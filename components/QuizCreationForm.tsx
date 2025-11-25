
import React, { useState, useMemo } from 'react';
import type { InputType, InputContext, QuizConfig, QuizDifficulty } from '../types';

interface QuizCreationFormProps {
    onSubmit: (context: InputContext, config: QuizConfig) => void;
    isLoading: boolean;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const QuizCreationForm: React.FC<QuizCreationFormProps> = ({ onSubmit, isLoading }) => {
    // Input Context State
    const [activeTab, setActiveTab] = useState<InputType>('topic');
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);
    
    // Quiz Config State
    const [config, setConfig] = useState<QuizConfig>({
        title: '',
        mcqCount: 3,
        shortAnswerCount: 2,
        mcqChoices: 4,
        difficulty: 'Moderate',
    });

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: name.includes('Count') || name.includes('Choices') ? parseInt(value, 10) : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setDocFile(file);
    };

    const isContextReady = useMemo(() => {
        switch (activeTab) {
            case 'topic': return topic.trim().length > 2;
            case 'text': return text.trim().length > 10;
            case 'image': return imageFile !== null;
            case 'document': return docFile !== null;
            default: return false;
        }
    }, [activeTab, topic, text, imageFile, docFile]);
    
    const isConfigReady = useMemo(() => {
        const { mcqCount, shortAnswerCount, mcqChoices } = config;
        if (mcqCount === 0 && shortAnswerCount === 0) return false;
        if (mcqCount > 0 && mcqChoices < 2) return false;
        return true;
    }, [config]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !isContextReady || !isConfigReady) return;

        let context: InputContext | null = null;
        switch (activeTab) {
            case 'topic': context = { type: 'topic', content: topic.trim() }; break;
            case 'text': context = { type: 'text', content: text.trim() }; break;
            case 'image': if (imageFile) context = { type: 'image', content: imageFile }; break;
            case 'document': if (docFile) context = { type: 'document', content: docFile }; break;
        }

        if (context) onSubmit(context, config);
    };

    const tabs: { id: InputType; label: string }[] = [
        { id: 'topic', label: 'From Topic' }, { id: 'text', label: 'From Text' },
        { id: 'image', label: 'From Image' }, { id: 'document', label: 'From Document' },
    ];

    const isSubmitDisabled = isLoading || !isContextReady || !isConfigReady;

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create a New Quiz</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* --- STEP 1: CONTEXT --- */}
                <div>
                    <label className="text-lg font-semibold text-slate-800">1. Provide Context</label>
                    <p className="text-sm text-slate-500 mb-4">Choose one source of information for the quiz.</p>
                    <div className="mb-4 border-b border-slate-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="min-h-[160px] p-2 bg-slate-50 rounded-lg border border-slate-200">
                        {activeTab === 'topic' && <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., 'The Renaissance' or 'React Hooks'" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>}
                        {activeTab === 'text' && <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste an article, story, or your notes here..." className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"/>}
                        {activeTab === 'image' && <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-100">{imagePreview ? <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" /> : <><UploadIcon /><p className="mt-1 text-sm text-slate-600">Click to upload an image (diagrams, photos, handwritten notes)</p></>}{imageFile && <p className="mt-2 text-sm text-slate-700 font-medium">{imageFile.name}</p>}<input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label>}
                        {activeTab === 'document' && <label htmlFor="doc-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-100"><UploadIcon /><p className="mt-1 text-sm text-slate-600">Click to upload a document</p><p className="text-xs text-slate-400 mt-1">Supports PDF, DOC, CSV, HTML, TXT, JSON</p>{docFile && <p className="mt-2 text-sm text-slate-700 font-medium">{docFile.name}</p>}<input id="doc-upload" type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.csv,.json,.xml,.html,.js,.css" onChange={handleDocChange} /></label>}
                    </div>
                </div>

                {/* --- STEP 2: CONFIGURATION --- */}
                <div>
                     <label className="text-lg font-semibold text-slate-800">2. Configure Quiz</label>
                     <p className="text-sm text-slate-500 mb-4">Set the structure and difficulty.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                         <div className="sm:col-span-2 lg:col-span-3 mb-2">
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Quiz Title (Optional)</label>
                            <input type="text" id="title" name="title" value={config.title} onChange={handleConfigChange} placeholder="e.g., 'Thermodynamics Mid-Term'" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white"/>
                            <p className="text-xs text-slate-400 mt-1">If left blank, AI will generate a title based on the context.</p>
                        </div>
                        <div>
                            <label htmlFor="mcqCount" className="block text-sm font-medium text-slate-700">MCQs</label>
                            <input type="number" id="mcqCount" name="mcqCount" value={config.mcqCount} onChange={handleConfigChange} min="0" max="10" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="shortAnswerCount" className="block text-sm font-medium text-slate-700">Short Answers</label>
                            <input type="number" id="shortAnswerCount" name="shortAnswerCount" value={config.shortAnswerCount} onChange={handleConfigChange} min="0" max="10" className="mt-1 w-full p-2 border border-slate-300 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="mcqChoices" className="block text-sm font-medium text-slate-700">Choices / MCQ</label>
                            <input type="number" id="mcqChoices" name="mcqChoices" value={config.mcqChoices} onChange={handleConfigChange} min="2" max="6" disabled={config.mcqCount === 0} className="mt-1 w-full p-2 border border-slate-300 rounded-md disabled:bg-slate-200"/>
                        </div>
                         <div className="sm:col-span-2 lg:col-span-3">
                            <label htmlFor="difficulty" className="block text-sm font-medium text-slate-700">Difficulty</label>
                            <select id="difficulty" name="difficulty" value={config.difficulty} onChange={handleConfigChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md">
                                <option>Easy</option>
                                <option>Moderate</option>
                                <option>Hard</option>
                            </select>
                        </div>
                     </div>
                </div>
                
                <button type="submit"
                    className="w-full mt-6 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                    disabled={isSubmitDisabled}>
                    {isLoading ? "Agent is working..." : "Generate Quiz with AI Agent"}
                </button>
            </form>
        </div>
    );
};
