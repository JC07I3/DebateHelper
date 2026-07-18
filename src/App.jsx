import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataEditor from './components/DataEditor';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, ChevronUp, Trash2, Save } from 'lucide-react';

function App() {
  const [currentContestId, setCurrentContestId] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  
  // Editor State
  const [doc, setDoc] = useState(null);
  const [showMetadata, setShowMetadata] = useState(false);

  // Sync active document
  useEffect(() => {
    if (!activeDocId) {
      setDoc(null);
      return;
    }
    const loadDoc = async () => {
      const data = await db.documents.get(activeDocId);
      setDoc(data);
    };
    loadDoc();
  }, [activeDocId]);

  const [localTitle, setLocalTitle] = useState('');
  const [localUrl, setLocalUrl] = useState('');

  // Sync local title and url when document selection changes
  useEffect(() => {
    if (doc) {
      setLocalTitle(doc.title || '');
      setLocalUrl(doc.url || '');
    } else {
      setLocalTitle('');
      setLocalUrl('');
    }
  }, [doc?.id]);

  const availableTags = useLiveQuery(
    () => currentContestId ? db.tags.where('contestId').equals(currentContestId).toArray() : [],
    [currentContestId]
  );

  const handleUpdateDoc = (updates) => {
    if (!activeDocId) return;
    setDoc(prevDoc => {
      if (!prevDoc) return prevDoc;
      const newDoc = { ...prevDoc, ...updates, id: activeDocId, updatedAt: new Date().toISOString() };
      // Save to DB in background
      db.documents.put(newDoc).catch(e => console.error('DB Update Error:', e));
      return newDoc;
    });
  };

  const handleDelete = async () => {
    if (!activeDocId) return;
    if (confirm('確定要刪除這份文件嗎？此操作無法復原。')) {
      await db.documents.delete(activeDocId);
      setActiveDocId(null);
    }
  };

  const toggleTag = (tagName) => {
    const currentTags = doc.tags ? JSON.parse(doc.tags) : [];
    const newTags = currentTags.includes(tagName) 
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName];
    handleUpdateDoc({ tags: JSON.stringify(newTags) });
  };

  const handleAddTag = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!val) return;
      if (val.includes('$')) { alert("標籤不能包含 $ 符號"); return; }
      
      const existing = await db.tags.where({ name: val, contestId: currentContestId }).first();
      if (!existing) {
        await db.tags.add({ name: val, contestId: currentContestId });
      }
      toggleTag(val);
      e.target.value = '';
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentContestId={currentContestId} 
        setCurrentContestId={setCurrentContestId} 
        activeDocId={activeDocId}
        setActiveDocId={setActiveDocId}
      />
      
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {doc ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', gap: '1rem' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <input 
                 type="text" 
                 value={localTitle}
                 onChange={e => {
                   const val = e.target.value;
                   setLocalTitle(val);
                   handleUpdateDoc({ title: val });
                 }}
                 placeholder="無標題文件"
                 style={{ 
                   fontSize: '1.8rem', 
                   fontWeight: 'bold', 
                   background: 'transparent', 
                   border: 'none', 
                   color: 'var(--text-primary)',
                   boxShadow: 'none',
                   padding: 0,
                   flex: 1
                 }}
               />
               <button type="button" className="danger" onClick={handleDelete} title="刪除文件">
                 <Trash2 size={18} />
               </button>
            </div>

            {/* Metadata Fold */}
            <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {doc.type !== 'info' && (
                    <>
                      <span>持方：{doc.side}</span>
                      <span>|</span>
                    </>
                  )}
                  <span>最後更新：{new Date(doc.updatedAt).toLocaleString()}</span>
                </div>
                {showMetadata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {showMetadata && (
                 <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '0.5rem' }}>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <label style={{ margin: 0, width: '60px' }}>文件種類</label>
                     <select value={doc.type} onChange={e => handleUpdateDoc({ type: e.target.value })} style={{ width: '130px' }}>
                       <option value="info">比賽基本資料</option>
                       <option value="note">筆記</option>
                       <option value="script">稿子</option>
                       <option value="data">資料</option>
                     </select>
                     
                     {doc.type !== 'info' && (
                       <>
                         <label style={{ margin: 0, marginLeft: '1rem' }}>持方</label>
                         <select value={doc.side} onChange={e => handleUpdateDoc({ side: e.target.value })} style={{ width: '120px' }}>
                           <option value="正方">正方</option>
                           <option value="反方">反方</option>
                           <option value="中性">中性</option>
                         </select>
                       </>
                     )}
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <label style={{ margin: 0, width: '60px' }}>文件連結</label>
                      <input 
                        type="url" 
                        value={localUrl} 
                        onChange={e => {
                          const val = e.target.value;
                          setLocalUrl(val);
                          handleUpdateDoc({ url: val });
                        }} 
                        placeholder="https://..."
                      />
                   </div>

                   <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                     <label style={{ margin: 0, width: '60px', paddingTop: '0.5rem' }}>標籤</label>
                     <div style={{ flex: 1, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                       {availableTags?.map(t => {
                         const isActive = (doc.tags ? JSON.parse(doc.tags) : []).includes(t.name);
                         return (
                           <button 
                             key={t.id} type="button"
                             className={`badge ${isActive ? 'blue' : 'gray'}`}
                             style={{ border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent' }}
                             onClick={() => toggleTag(t.name)}
                           >
                             {t.name}
                           </button>
                         );
                       })}
                       <input 
                         type="text" 
                         placeholder="+ 按 Enter 新增標籤" 
                         onKeyDown={handleAddTag}
                         style={{ width: 'auto', background: 'transparent', border: '1px dashed var(--panel-border)', padding: '0.125rem 0.5rem', fontSize: '0.8rem', borderRadius: '9999px' }}
                       />
                     </div>
                   </div>
                 </div>
              )}
            </div>

            {/* Editor */}
            <div style={{ flex: 1, minHeight: 0 }}>
               <DataEditor 
                 value={doc.content} 
                 onChange={val => handleUpdateDoc({ content: val })} 
               />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }}>✍️</div>
              <p>從左側選擇一份文件開始編輯</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>或者在分類旁點擊 + 新增</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
