'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Meeting } from '@/lib/types';

function groupByDate(meetings: Meeting[]) {
  const groups: Record<string, Meeting[]> = {};
  for (const m of meetings) {
    const date = new Date(m.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  }
  return groups;
}

function formatDuration(secs: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60);
  return m < 1 ? `${secs}s` : `${m}m`;
}

function StatusDot({ status }: { status: Meeting['status'] }) {
  if (status === 'done' || status === 'idle') return null;
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />;
}

export default function MeetingList({ meetings }: { meetings: Meeting[] }) {
  const pathname = usePathname();
  const groups = groupByDate(meetings);

  if (meetings.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-xs text-gray-400">
        No meetings yet. Hit Record to start.
      </div>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2">
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="mb-3">
          <div className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
            {label}
          </div>
          {items.map((m) => {
            const active = pathname === `/meetings/${m.id}`;
            return (
              <Link
                key={m.id}
                href={`/meetings/${m.id}`}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md mx-1 transition-colors ${
                  active
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <StatusDot status={m.status} />
                <span className="flex-1 truncate">{m.title}</span>
                {m.duration > 0 && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDuration(m.duration)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
