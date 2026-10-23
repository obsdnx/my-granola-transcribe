import { NextResponse } from 'next/server';
import { listMeetings, createMeeting } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  const meetings = listMeetings();
  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const meeting = {
    id: randomUUID(),
    title: body.title || 'Untitled Meeting',
    created_at: new Date().toISOString(),
    duration: 0,
    transcript: '',
    notes: '',
    status: 'idle' as const,
  };
  createMeeting(meeting);
  return NextResponse.json(meeting, { status: 201 });
}
