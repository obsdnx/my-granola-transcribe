'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

async function safeJson(res: Response): Promise<Record<string, string>> {
  try {
    return await res.json();
  } catch {
    return { error: `Server error (${res.status})` };
  }
}

type RecorderState = 'idle' | 'recording' | 'processing';

export default function Recorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    setError('');
    try {
      // Try to get system audio via getDisplayMedia, fall back to mic only
      let stream: MediaStream;
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        audioCtx.createMediaStreamSource(displayStream).connect(dest);
        audioCtx.createMediaStreamSource(micStream).connect(dest);
        // Stop the video track — we only want audio
        displayStream.getVideoTracks().forEach((t) => t.stop());
        stream = dest.stream;
      } catch {
        // User cancelled screen share or browser doesn't support it — use mic only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      startTimeRef.current = Date.now();
      setState('recording');
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
      console.error(err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    setState('processing');
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve();
      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach((t) => t.stop());
    });

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

    try {
      // Create meeting record
      const meetingRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Meeting — ${new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}`,
        }),
      });
      const meeting = await safeJson(meetingRes);

      // Update status to transcribing
      await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'transcribing', duration }),
      });

      // Transcribe
      const form = new FormData();
      form.append('audio', audioBlob, 'recording.webm');
      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: form });
      const { transcript, error: tErr } = await safeJson(transcribeRes);

      if (tErr || !transcript) {
        await fetch(`/api/meetings/${meeting.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done', transcript: tErr || 'Transcription failed.' }),
        });
        router.push(`/meetings/${meeting.id}`);
        setState('idle');
        setElapsed(0);
        return;
      }

      // Update transcript, start generating notes
      await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, status: 'generating' }),
      });

      // Generate notes
      const notesRes = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title: meeting.title }),
      });
      const { notes, error: nErr } = await safeJson(notesRes);

      await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || nErr || '', status: 'done' }),
      });

      router.push(`/meetings/${meeting.id}`);
    } catch (err) {
      setError('Something went wrong processing the recording.');
      console.error(err);
    }

    setState('idle');
    setElapsed(0);
  }, [router]);

  if (state === 'processing') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        Processing recording…
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-full transition-colors"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          Stop — {formatTime(elapsed)}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={startRecording}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-full transition-colors"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
        Record
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
