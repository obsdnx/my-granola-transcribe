export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getMeeting } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import NotesEditor from '@/components/NotesEditor';

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-white">
        <NotesEditor meeting={meeting} />
      </main>
    </div>
  );
}
