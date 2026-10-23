import Link from 'next/link';
import { listMeetings } from '@/lib/db';
import MeetingList from './MeetingList';
import Recorder from './Recorder';

export default async function Sidebar() {
  const meetings = listMeetings();

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="text-sm font-semibold text-gray-900">Granola</span>
        </Link>
      </div>

      <div className="px-3 py-3 border-b border-gray-200">
        <Recorder />
      </div>

      <MeetingList meetings={meetings} />
    </aside>
  );
}
