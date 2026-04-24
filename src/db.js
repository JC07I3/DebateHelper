import Dexie from 'dexie';

export const db = new Dexie('DebateHelperDB');

// Version 2: Shift to document-centric model
db.version(2).stores({
  contests: '++id, &name',
  tags: '++id, name, contestId',
  documents: '++id, title, type, content, side, contestId, createdAt, updatedAt'
}).upgrade(tx => {
  // Try to migrate data if any exists in version 1
  return tx.table('debateData').toArray().then(data => {
    if (data && data.length > 0) {
      return tx.table('documents').bulkAdd(data.map(d => ({
        ...d,
        type: 'note' // default legacy data to 'note'
      })));
    }
  }).catch(() => {}); // Ignore error if table debateData didn't exist
});
db.version(1).stores({
  contests: '++id, &name',
  tags: '++id, name, contestId',
  debateData: '++id, title, url, content, side, contestId, createdAt, updatedAt'
});

export const exportData = async () => {
  const contests = await db.contests.toArray();
  const tags = await db.tags.toArray();
  const documents = await db.documents.toArray();

  const data = JSON.stringify({ contests, tags, documents }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `debate_helper_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.contests || !data.tags || !data.documents) {
      throw new Error('無效的備份檔案：缺少必要資料表。');
    }

    await db.transaction('rw', db.contests, db.tags, db.documents, async () => {
      await db.contests.clear();
      await db.tags.clear();
      await db.documents.clear();

      await db.contests.bulkAdd(data.contests);
      await db.tags.bulkAdd(data.tags);
      await db.documents.bulkAdd(data.documents);
    });
    
    return { success: true };
  } catch (err) {
    console.error("Import failed:", err);
    return { success: false, error: err.message || '檔案解析失敗' };
  }
};
