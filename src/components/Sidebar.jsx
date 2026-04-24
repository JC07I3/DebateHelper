import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportData, importData } from '../db';
import { Plus, Trash2, Folder, Tag, Download, Upload, FileText, File, Link as LinkIcon, ChevronRight, ChevronDown } from 'lucide-react';

export default function Sidebar({ currentContestId, setCurrentContestId, activeDocId, setActiveDocId }) {
  const contests = useLiveQuery(() => db.contests.toArray());
  const documents = useLiveQuery(
    () => currentContestId ? db.documents.where('contestId').equals(currentContestId).toArray() : []
  );

  const [newContestName, setNewContestName] = useState('');
  
  // Collapse states for categories
  const [openCategories, setOpenCategories] = useState({ note: true, script: true, data: true });

  const toggleCategory = (type) => setOpenCategories(prev => ({ ...prev, [type]: !prev[type] }));

  const handleAddContest = async (e) => {
    e.preventDefault();
    if (!newContestName.trim()) return;
    const name = newContestName.trim();
    const existing = await db.contests.where('name').equals(name).first();
    if (existing) {
      alert("盃賽已存在");
      return;
    }
    const id = await db.contests.add({ name });
    setCurrentContestId(id);
    setNewContestName('');
  };

  const handleCreateDocument = async (type) => {
    if (!currentContestId) return;
    const newDocId = await db.documents.add({
      title: '未命名文件',
      type,
      content: '',
      side: '中性',
      tags: '[]',
      url: '',
      contestId: currentContestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveDocId(newDocId);
    setOpenCategories(prev => ({ ...prev, [type]: true }));
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const result = await importData(text);
      if (result.success) {
        alert('資料匯入成功！');
        setCurrentContestId(null);
        setActiveDocId(null);
      } else {
        alert('匯入失敗：' + result.error);
      }
    };
    input.click();
  };

  const categories = [
    { type: 'info', label: 'ℹ️ 比賽基本資料', icon: FileText },
    { type: 'note', label: '📒 筆記', icon: FileText },
    { type: 'script', label: '📖 講稿', icon: File },
    { type: 'data', label: '🔗 參考資料', icon: LinkIcon }
  ];

  return (
    <div className="glass-panel" style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--panel-border)'}}>
      
      {/* Contest Selector */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
          <Folder size={18} /> 盃賽工作區
        </h2>
        <select 
          value={currentContestId || ''} 
          onChange={(e) => setCurrentContestId(Number(e.target.value) || null)}
          style={{ marginBottom: '1rem' }}
        >
          <option value="">-- 選擇盃賽 --</option>
          {contests?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <form onSubmit={handleAddContest} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="新增盃賽..." 
            value={newContestName}
            onChange={(e) => setNewContestName(e.target.value)}
          />
          <button type="submit" className="primary" style={{ padding: '0 0.75rem' }}><Plus size={16} /></button>
        </form>
      </div>

      {/* Document Tree */}
      {currentContestId ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
          {categories.map(cat => {
            const docsInCat = documents?.filter(d => d.type === cat.type) || [];
            const isOpen = openCategories[cat.type];

            return (
              <div key={cat.type} style={{ marginBottom: '0.5rem' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  onClick={() => toggleCategory(cat.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {cat.label}
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleCreateDocument(cat.type); }}
                    style={{ background: 'transparent', padding: '0.25rem', color: 'inherit' }}
                    title={`新增${cat.label}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 0.5rem' }}>
                    {docsInCat.map(doc => (
                      <div 
                        key={doc.id}
                        onClick={() => setActiveDocId(doc.id)}
                        style={{
                          padding: '0.4rem 1rem 0.4rem 2rem',
                          margin: '0 0.5rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          background: activeDocId === doc.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                          color: activeDocId === doc.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {doc.title || '未命名'}
                      </div>
                    ))}
                    {docsInCat.length === 0 && (
                      <div style={{ padding: '0.5rem 2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
                        無文件
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
          請先選擇或建立<br/>一個盃賽工作區
        </div>
      )}

      {/* Settings / Backup */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--panel-border)', display: 'flex', gap: '0.5rem' }}>
        <button onClick={exportData} style={{ flex: 1, padding: '0.5rem 0' }} title="匯出 JSON">
          <Download size={16} />
        </button>
        <button onClick={handleImportClick} style={{ flex: 1, padding: '0.5rem 0' }} title="匯入 JSON">
          <Upload size={16} />
        </button>
      </div>
    </div>
  );
}
