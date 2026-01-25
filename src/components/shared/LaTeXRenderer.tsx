import React, { useMemo } from 'react';
import katex from 'katex';

interface LaTeXRendererProps {
  text: string;
  className?: string;
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ text, className }) => {
  const renderedContent = useMemo(() => {
    if (!text) return '';
    
    // Helper to escape HTML to prevent XSS before rendering LaTeX
    const escapeHtml = (unsafe: string) => {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    let result = text;
    
    // We split by LaTeX delimiters to render parts
    // Simple approach: Replace $$...$$ and $...$ with rendered HTML
    
    try {
      // Block LaTeX $$...$$
      result = result.replace(/\$\$(.*?)\$\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex, { displayMode: true, throwOnError: false });
        } catch (e) {
          return match;
        }
      });
      
      // Inline LaTeX $...$
      result = result.replace(/\$(.*?)\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex, { displayMode: false, throwOnError: false });
        } catch (e) {
          return match;
        }
      });
    } catch (e) {
      console.error("LaTeX render error", e);
      return text;
    }
    
    return result;
  }, [text]);

  // If simple text with no latex, just render it. 
  // If it contains HTML from KaTeX, we need dangerouslySetInnerHTML
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }} 
    />
  );
};

export default LaTeXRenderer;