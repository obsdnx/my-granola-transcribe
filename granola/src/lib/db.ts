import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Meeting } from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'granola.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    transcript TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'idle'
  )
`);

export function listMeetings(): Meeting[] {
  return db
    .prepare('SELECT * FROM meetings ORDER BY created_at DESC')
    .all() as Meeting[];
}

export function getMeeting(id: string): Meeting | undefined {
  return db
    .prepare('SELECT * FROM meetings WHERE id = ?')
    .get(id) as Meeting | undefined;
}

export function createMeeting(meeting: Meeting): void {
  db.prepare(
    `INSERT INTO meetings (id, title, created_at, duration, transcript, notes, status)
     VALUES (@id, @title, @created_at, @duration, @transcript, @notes, @status)`
  ).run(meeting);
}

export function updateMeeting(id: string, data: Partial<Omit<Meeting, 'id'>>): void {
  const fields = Object.keys(data)
    .map((k) => `${k} = @${k}`)
    .join(', ');
  db.prepare(`UPDATE meetings SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function deleteMeeting(id: string): void {
  db.prepare('DELETE FROM meetings WHERE id = ?').run(id);
}
