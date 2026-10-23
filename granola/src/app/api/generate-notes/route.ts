import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in .env.local' }, { status: 500 });
    }

    const { transcript, title } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: key });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a meeting notes assistant. Given this meeting transcript, generate clean, structured notes.

Meeting title: ${title || 'Untitled Meeting'}

Transcript:
${transcript}

Generate notes in this exact markdown format:
## Summary
2-3 sentence overview of what was discussed.

## Key Points
- Point 1
- Point 2
- Point 3

## Action Items
- [ ] Action 1 (owner if mentioned)
- [ ] Action 2

## Decisions Made
- Decision 1
- Decision 2

Only include sections that have content. Be concise and specific.`,
        },
      ],
    });

    const notes =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ notes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Note generation failed';
    console.error('[generate-notes]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
