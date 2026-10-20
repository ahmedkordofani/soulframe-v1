// V6.0.9 - Read-only storage inspection. Prints counts and errors, never client metadata.
import { lstat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { LocalProjectStore } from './projectStore.mjs';

export async function auditLocalStorage({ filePath = resolve(process.cwd(), '.soulframe-local', 'projects.json') } = {}) {
  const path = resolve(filePath);
  try {
    const fileInfo = await lstat(path).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!fileInfo) return { ok: true, exists: false, projectCount: 0, snapshotCount: 0, bytes: 0 };
    if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) {
      return { ok: false, exists: true, error: 'Storage path is not a regular file' };
    }
    const folderInfo = await lstat(dirname(path));
    if (folderInfo.isSymbolicLink()) {
      return { ok: false, exists: true, error: 'Storage directory is a symlink' };
    }
    const data = await new LocalProjectStore({ filePath: path }).read();
    return { ok: true, exists: true, projectCount: data.projects.length,
      snapshotCount: data.history.length, bytes: fileInfo.size };
  } catch {
    return { ok: false, exists: true, error: 'Could not safely read and validate local project storage' };
  }
}
