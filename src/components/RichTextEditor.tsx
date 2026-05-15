import React, { useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Link as LinkIcon, Code, List } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, readOnly = false, disabled = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  // Track if the change came from outside (parent) or inside (user typing)
  const isInternalChange = useRef(false);

  // Sync external `value` prop into the contentEditable div
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      // Only update if content actually differs to avoid cursor jumping
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execFormat = (command: string, value?: string) => {
    if (readOnly || disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Trigger onChange after execCommand modifies the DOM
    setTimeout(() => {
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  };

  const handleBold = () => execFormat('bold');
  const handleItalic = () => execFormat('italic');
  const handleCode = () => {
    if (readOnly || disabled) return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const code = document.createElement('code');
      code.style.cssText = 'background:rgba(0,210,106,0.1);color:var(--primary-green);padding:0 4px;border-radius:3px;font-family:monospace;font-size:0.85em;';
      code.textContent = selectedText || 'code';
      range.deleteContents();
      range.insertNode(code);
      // Move cursor after the code element
      range.setStartAfter(code);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setTimeout(() => {
      if (editorRef.current) {
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
      }
    }, 0);
  };
  const handleLink = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) execFormat('createLink', url);
  };
  const handleList = () => execFormat('insertUnorderedList');

  return (
    <div style={{ 
      border: `1px solid ${readOnly ? 'var(--border-color)' : 'var(--primary-green)'}`, 
      borderRadius: '8px', 
      overflow: 'hidden',
      backgroundColor: readOnly ? 'rgba(0,0,0,0.2)' : 'var(--bg-dark)',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease'
    }}>
      {!readOnly && (
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          padding: '0.5rem', 
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(255,255,255,0.02)'
        }}>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); handleBold(); }}
            disabled={disabled}
            className="toolbar-btn hover-lift"
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); handleItalic(); }}
            disabled={disabled}
            className="toolbar-btn hover-lift"
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
            disabled={disabled}
            className="toolbar-btn hover-lift"
            title="Insert Link"
          >
            <LinkIcon size={14} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); handleCode(); }}
            disabled={disabled}
            className="toolbar-btn hover-lift"
            title="Inline Code"
          >
            <Code size={14} />
          </button>
          <button 
            type="button" 
            onMouseDown={(e) => { e.preventDefault(); handleList(); }}
            disabled={disabled}
            className="toolbar-btn hover-lift"
            title="Bullet List"
          >
            <List size={14} />
          </button>
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!readOnly && !disabled}
        onInput={handleInput}
        suppressContentEditableWarning
        style={{
          minHeight: '120px',
          padding: '0.75rem',
          color: 'var(--text-main)',
          fontFamily: 'var(--font-family)',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          outline: 'none',
          cursor: (readOnly || disabled) ? 'default' : 'text',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
      <style>{`
        .toolbar-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem 0.4rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .toolbar-btn:hover:not(:disabled) {
          color: var(--primary-green);
          background: rgba(0, 210, 106, 0.1);
        }
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        [contenteditable] a { color: var(--primary-green); text-decoration: underline; }
        [contenteditable] ul { padding-left: 1.25rem; margin: 0.25rem 0; }
        [contenteditable] li { margin: 0.1rem 0; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
