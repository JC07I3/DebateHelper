import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { vim } from '@replit/codemirror-vim';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit2, Eye, LayoutTemplate, Keyboard } from 'lucide-react';

export default function DataEditor({ value, onChange, height = '400px' }) {
  const [mode, setMode] = useState('split'); // 'edit', 'preview', 'split'
  const [vimMode, setVimMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    // calculate word count
    const count = (value || '').trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(count);
  }, [value]);

  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping
  ];
  
  if (vimMode) {
    extensions.push(vim());
  }

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
      <div className="editor-toolbar glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button"
            className={mode === 'edit' ? 'primary' : ''} 
            onClick={() => setMode('edit')}
            title="純文字編輯"
          >
            <Edit2 size={16} /> <span style={{fontSize: '0.8rem'}}>編輯</span>
          </button>
          <button 
            type="button"
            className={mode === 'preview' ? 'primary' : ''} 
            onClick={() => setMode('preview')}
            title="純預覽"
          >
            <Eye size={16} /> <span style={{fontSize: '0.8rem'}}>預覽</span>
          </button>
          <button 
            type="button"
            className={mode === 'split' ? 'primary' : ''} 
            onClick={() => setMode('split')}
            title="雙欄模式"
          >
            <LayoutTemplate size={16} /> <span style={{fontSize: '0.8rem'}}>雙欄</span>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            字數: {wordCount}
          </span>
          <button
            type="button"
            className={vimMode ? 'primary' : ''}
            onClick={() => setVimMode(!vimMode)}
            title="開啟/關閉 Vim 模式"
          >
            <Keyboard size={16} /> <span style={{fontSize: '0.8rem'}}>Vim</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0 }}>
        {(mode === 'edit' || mode === 'split') && (
          <div style={{ flex: 1, overflow: 'auto', borderRadius: '6px', border: '1px solid var(--panel-border)' }}>
            <CodeMirror
              value={value}
              height="100%"
              extensions={extensions}
              onChange={(val) => onChange(val)}
              theme="dark"
              style={{ height: '100%' }}
            />
          </div>
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div className="glass-panel markdown-preview" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*沒有內容*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
