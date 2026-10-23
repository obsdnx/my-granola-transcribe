export const dynamic = 'force-dynamic';

import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-4xl mb-4">🌿</p>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Granola</h1>
          <p className="text-sm text-gray-400 max-w-xs">
            Hit <strong className="text-gray-600">Record</strong> to capture your next meeting.
            Your notes will appear here automatically.
          </p>
        </div>
      </main>
    </div>
  );
}
