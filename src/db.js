import Dexie from 'dexie';

export const db = new Dexie('DebateHelperDB');

// Version 3: Custom folders instead of hardcoded types
db.version(3).stores({
  contests: '++id, &name',
  tags: '++id, name, contestId',
  folders: '++id, name, contestId',
  documents: '++id, title, folderId, type, content, side, contestId, createdAt, updatedAt'
}).upgrade(async tx => {
  const contests = await tx.table('contests').toArray();
  const folderCache = {}; // contestId_type -> folderId

  for (const contest of contests) {
    const categories = [
      { type: 'info', name: '比賽基本資料' },
      { type: 'note', name: '筆記' },
      { type: 'script', name: '稿子' },
      { type: 'data', name: '資料' }
    ];

    for (const cat of categories) {
      const folderId = await tx.table('folders').add({
        name: cat.name,
        contestId: contest.id
      });
      folderCache[`${contest.id}_${cat.type}`] = folderId;
    }
  }

  await tx.table('documents').toCollection().modify(doc => {
    if (doc.type && doc.contestId) {
      doc.folderId = folderCache[`${doc.contestId}_${doc.type}`] || null;
      delete doc.type;
    }
  });
});

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
  const folders = await db.folders.toArray();
  const documents = await db.documents.toArray();

  const data = JSON.stringify({ contests, tags, folders, documents }, null, 2);
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
    if (!data.contests || !data.documents) {
      throw new Error('無效的備份檔案：缺少必要資料表。');
    }

    await db.transaction('rw', db.contests, db.tags, db.folders, db.documents, async () => {
      await db.contests.clear();
      await db.tags.clear();
      await db.folders.clear();
      await db.documents.clear();

      await db.contests.bulkAdd(data.contests);
      if (data.tags) await db.tags.bulkAdd(data.tags);
      if (data.folders) await db.folders.bulkAdd(data.folders);
      await db.documents.bulkAdd(data.documents);
    });
    
    return { success: true };
  } catch (err) {
    console.error("Import failed:", err);
    return { success: false, error: err.message || '檔案解析失敗' };
  }
};
