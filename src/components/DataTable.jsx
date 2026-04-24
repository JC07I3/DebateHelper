import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, Filter, Edit, Trash2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DataTable({ currentContestId, onEdit }) {
  const [filterTitle, setFilterTitle] = useState('');
  const [filterSide, setFilterSide] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const rawData = useLiveQuery(
    () => currentContestId ? db.debateData.where('contestId').equals(currentContestId).reverse().sortBy('createdAt') : []
  );

  const tags = useLiveQuery(
    () => currentContestId ? db.tags.where('contestId').equals(currentContestId).toArray() : []
  );

  const handleDelete = async (id) => {
    if (confirm('確定要刪除這筆資料嗎？')) {
      await db.debateData.delete(id);
    }
  };

  if (!currentContestId) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>請先選擇一個盃賽</div>;
  }

  const data = (rawData || []).filter(item => {
    if (filterTitle && !item.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
    if (filterSide && item.side !== filterSide) return false;
    if (filterTag) {
      const itemTags = item.tags ? JSON.parse(item.tags) : [];
      if (!itemTags.includes(filterTag)) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      
      {/* Filters */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="搜尋標題..." 
            value={filterTitle}
            onChange={e => setFilterTitle(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--text-secondary)" />
          <select value={filterSide} onChange={e => setFilterSide(e.target.value)}>
            <option value="">全部持方</option>
            <option value="正方">正方</option>
            <option value="反方">反方</option>
            <option value="中性">中性</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TagIcon />
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}>
            <option value="">全部標籤</option>
            {tags?.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', alignContent: 'start' }}>
        {data.map(item => {
          const itemTags = item.tags ? JSON.parse(item.tags) : [];
          return (
            <div key={item.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, wordBreak: 'break-word' }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button type="button" onClick={() => onEdit(item)} style={{ padding: '0.25rem' }} title="編輯">
                    <Edit size={16} />
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(item.id)} style={{ padding: '0.25rem' }} title="刪除">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${item.side === '正方' ? 'blue' : item.side === '反方' ? 'red' : 'gray'}`}>
                  {item.side}
                </span>
                {itemTags.map(t => <span key={t} className="badge gray">{t}</span>)}
              </div>

              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
                  <ExternalLink size={14} /> 參考連結
                </a>
              )}

              <div style={{ flex: 1, marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                {item.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{p: ({node, ...props}) => <span {...props} />}} >
                    {item.content}
                  </ReactMarkdown>
                ) : (
                  <em style={{opacity: 0.5}}>無內容</em>
                )}
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            沒有符合的資料
          </div>
        )}
      </div>
    </div>
  );
}

function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  );
}
