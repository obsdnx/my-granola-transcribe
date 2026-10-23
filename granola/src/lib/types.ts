export interface Meeting {
  id: string;
  title: string;
  created_at: string;
  duration: number; // seconds
  transcript: string;
  notes: string;
  status: 'idle' | 'recording' | 'transcribing' | 'generating' | 'done';
}
