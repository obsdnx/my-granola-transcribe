'use client';

import { useState, useCallback } from 'react';
import type { Meeting } from '@/lib/types';

function renderMarkdown(text: string) {
  // Simple markdown renderer for the notes
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-5 mb-3 space-y-1">
          {listItems.map((item, i) => {
            const isCheckbox = item.startsWith('[ ] ') || item.startsWith('[x] ');
            const checked = item.startsWith('[x] ');
            const text = isCheckbox ? item.slice(4) : item;
            return (
              <li key={i} className="text-sm text-gray-700">
                {isCheckbox ? (
                  <span className="flex items-start gap-2">
                    <span className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${checked ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300'}`}>
                      {checked ? '✓' : ''}
                    </span>
                    {text}
                  </span>
                ) : text}
              </li>
            );
          })}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-sm font-semibold text-gray-900 mt-5 mb-2 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-sm text-gray-700 mb-2 leading-relaxed">
          {line}
        </p>
      );
    }
  }
  flushList();
  return elements;
}

export default function NotesEditor({ meeting }: { meeting: Meeting }) {
  const [tab, setTab] = useState<'notes' | 'transcript'>('notes');
  const [notes, setNotes] = useState(meeting.notes);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(meeting.title);

  const saveNotes = useCallback(async (value: string) => {
    setSaving(true);
    await fetch(`/api/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: value }),
    });
    setSaving(false);
  }, [meeting.id]);

  const saveTitle = useCallback(async (value: string) => {
    await fetch(`/api/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: value }),
    });
  }, [meeting.id]);

  const isProcessing = ['recording', 'transcribing', 'generating'].includes(meeting.status);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => saveTitle(title)}
          className="text-xl font-semibold text-gray-900 w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-300"
          placeholder="Untitled Meeting"
        />
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span>{new Date(meeting.created_at).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
          })}</span>
          {meeting.duration > 0 && (
            <>
              <span>·</span>
              <span>{Math.floor(meeting.duration / 60)}m {meeting.duration % 60}s</span>
            </>
          )}
          {isProcessing && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-blue-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {meeting.status === 'transcribing' ? 'Transcribing…' : 'Generating notes…'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-8 gap-4 border-b border-gray-100">
        {(['notes', 'transcript'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 text-sm border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {tab === 'notes' ? (
          <div>
            {!notes && !isProcessing ? (
              <p className="text-sm text-gray-400 italic">No notes generated yet.</p>
            ) : isProcessing && !notes ? (
              <div className="space-y-3 animate-pulse">
                {[80, 60, 90, 50, 70].map((w, i) => (
                  <div key={i} className={`h-3 bg-gray-100 rounded`} style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : editing ? (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-96 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={async () => { await saveNotes(notes); setEditing(false); }}
                    className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-700"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setNotes(meeting.notes); setEditing(false); }}
                    className="px-3 py-1.5 text-gray-500 text-xs rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-text group relative"
                onClick={() => setEditing(true)}
              >
                <div className="prose max-w-none">
                  {renderMarkdown(notes)}
                </div>
                <button
                  className="absolute top-0 right-0 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:text-gray-500"
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            {meeting.transcript ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {meeting.transcript}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No transcript yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
