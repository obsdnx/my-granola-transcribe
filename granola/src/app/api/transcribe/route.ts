import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile } from 'openai';

export async function POST(req: Request) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set in .env.local' }, { status: 500 });
    }

    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    if (audioBlob.size < 1000) {
      return NextResponse.json({ error: 'Recording too short — nothing to transcribe' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: key });

    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = await toFile(buffer, 'recording.webm', { type: 'audio/webm' });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return NextResponse.json({ transcript: transcription });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed';
    console.error('[transcribe]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
