import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportData, importData } from '../db';
import { Plus, Trash2, Folder, Tag, Download, Upload, FileText, File, Link as LinkIcon, ChevronRight, ChevronDown } from 'lucide-react';

export default function Sidebar({ currentContestId, setCurrentContestId, activeDocId, setActiveDocId, isSidebarOpen }) {
  const contests = useLiveQuery(() => db.contests.toArray());
  const documents = useLiveQuery(
    () => currentContestId ? db.documents.where('contestId').equals(currentContestId).toArray() : [],
    [currentContestId]
  );

  const folders = useLiveQuery(
    () => currentContestId ? db.folders.where('contestId').equals(currentContestId).toArray() : [],
    [currentContestId]
  );

  const [newContestName, setNewContestName] = useState('');
  
  // Collapse states for folders
  const [openFolders, setOpenFolders] = useState({});

  const toggleFolder = (folderId) => setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));

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

  const handleDeleteContest = async () => {
    if (!currentContestId) return;
    const contest = contests.find(c => c.id === currentContestId);
    if (confirm(`確定要刪除「${contest?.name}」嗎？這將會刪除該盃賽下所有的文件與標籤，且無法復原。`)) {
      await db.transaction('rw', db.contests, db.documents, db.tags, async () => {
        await db.documents.where('contestId').equals(currentContestId).delete();
        await db.tags.where('contestId').equals(currentContestId).delete();
        await db.contests.delete(currentContestId);
      });
      setCurrentContestId(null);
      setActiveDocId(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!currentContestId) return;
    const name = prompt('請輸入新資料夾名稱：');
    if (!name || !name.trim()) return;
    await db.folders.add({ name: name.trim(), contestId: currentContestId });
    // Default open newly created folder
    const latestFolders = await db.folders.where('contestId').equals(currentContestId).toArray();
    const newFolder = latestFolders.find(f => f.name === name.trim());
    if (newFolder) {
      setOpenFolders(prev => ({ ...prev, [newFolder.id]: true }));
    }
  };

  const handleDeleteFolder = async (e, folderId, folderName) => {
    e.stopPropagation();
    if (confirm(`確定要刪除「${folderName}」資料夾嗎？裡面的所有文件將會被一併刪除且無法復原！`)) {
      await db.transaction('rw', db.folders, db.documents, async () => {
        await db.documents.where({ folderId }).delete();
        await db.folders.delete(folderId);
      });
      // Optionally could clear activeDocId if it was in the deleted folder
    }
  };

  const handleCreateDocument = async (folderId) => {
    if (!currentContestId) return;
    
    let title = prompt(`請輸入新文件名稱：`, '未命名文件');
    
    // If user clicks Cancel on prompt, title is null. Do not create.
    if (title === null) return;
    
    title = title.trim() || '未命名文件';

    const newDocId = await db.documents.add({
      title,
      folderId,
      content: '',
      side: '中性',
      tags: '[]',
      url: '',
      contestId: currentContestId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveDocId(newDocId);
    setOpenFolders(prev => ({ ...prev, [folderId]: true }));
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

  return (
    <div className="glass-panel sidebar-container" style={{ 
      width: isSidebarOpen ? '280px' : '0px', 
      opacity: isSidebarOpen ? 1 : 0,
      flexShrink: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      borderRight: isSidebarOpen ? '1px solid var(--panel-border)' : 'none',
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    }}>
      
      {/* Contest Selector */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--panel-border)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
          <Folder size={18} /> 盃賽工作區
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <select 
            value={currentContestId || ''} 
            onChange={(e) => setCurrentContestId(Number(e.target.value) || null)}
            style={{ flex: 1 }}
          >
            <option value="">-- 選擇盃賽 --</option>
            {contests?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {currentContestId && (
            <button 
              type="button" 
              className="danger" 
              onClick={handleDeleteContest}
              title="刪除盃賽"
              style={{ padding: '0 0.5rem' }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        
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
          {folders?.map(folder => {
            const docsInFolder = documents?.filter(d => d.folderId === folder.id) || [];
            const isOpen = openFolders[folder.id];

            return (
              <div key={folder.id} style={{ marginBottom: '0.5rem' }}>
                <div 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {folder.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button 
                      type="button" 
                      onClick={(e) => handleDeleteFolder(e, folder.id, folder.name)}
                      style={{ background: 'transparent', padding: '0.25rem', color: 'inherit', opacity: 0.6 }}
                      title={`刪除資料夾`}
                    >
                      <Trash2 size={12} />
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleCreateDocument(folder.id); }}
                      style={{ background: 'transparent', padding: '0.25rem', color: 'inherit' }}
                      title={`新增文件`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                
                {isOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 0.5rem' }}>
                    {docsInFolder.map(doc => (
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
                    {docsInFolder.length === 0 && (
                      <div style={{ padding: '0.5rem 2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
                        無文件
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          <div style={{ padding: '0.5rem 1rem' }}>
            <button onClick={handleCreateFolder} className="secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.4rem' }}>
              <Plus size={14} /> 新增資料夾
            </button>
          </div>
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
