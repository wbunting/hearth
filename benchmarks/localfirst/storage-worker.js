// Development-only wa-sqlite comparison. Serve alongside an unpacked
// wa-sqlite@1.0.0 npm package at ./package (see persistence.md).
import SQLiteESMFactory from './package/dist/wa-sqlite.mjs';
import * as SQLite from './package/src/sqlite-api.js';
import { AccessHandlePoolVFS } from './package/src/examples/AccessHandlePoolVFS.js';

self.onmessage = async ({ data }) => {
  try {
    const start = performance.now();
    const module = await SQLiteESMFactory();
    const sqlite = SQLite.Factory(module);
    const vfs = new AccessHandlePoolVFS('hearth-storage-benchmark');
    await vfs.isReady;
    sqlite.vfs_register(vfs, true);
    const db = await sqlite.open_v2('rows.sqlite');
    await sqlite.exec(db, 'CREATE TABLE IF NOT EXISTS rows (id TEXT PRIMARY KEY, data TEXT)');
    const open = performance.now() - start;
    if (data.rows) {
      const writeStart = performance.now();
      await sqlite.exec(db, 'BEGIN; DELETE FROM rows');
      for await (const stmt of sqlite.statements(db, 'INSERT INTO rows VALUES (?,?)')) {
        for (const row of data.rows) {
          sqlite.bind_collection(stmt, [row.id, JSON.stringify(row)]);
          await sqlite.step(stmt);
          await sqlite.reset(stmt);
        }
      }
      await sqlite.exec(db, 'COMMIT');
      self.postMessage({ type: 'write', ms: performance.now() - writeStart, open });
    }
    const readStart = performance.now();
    let count = 0;
    await sqlite.exec(db, 'SELECT data FROM rows', row => { JSON.parse(row[0]); count++; });
    self.postMessage({ type: 'read', ms: performance.now() - readStart, count, open });
    await sqlite.close(db);
    await vfs.close();
  } catch (error) {
    self.postMessage({ error: String(error) });
  }
};
