
import React from 'react';

interface MathRendererProps {
    text: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
    // The AI now returns clean, textbook-style Unicode text (e.g., x², H₂O, →) 
    // instead of complex LaTeX code. We can simply render it as text.
    return (
        <span className="math-renderer whitespace-pre-wrap font-sans">
            {text}
        </span>
    );
};
