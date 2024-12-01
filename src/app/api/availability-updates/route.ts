import { NextResponse } from 'next/server';

const clients = new Set<ReadableStreamController<Uint8Array>>();

export function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clients.add(controller);

      // Remove client when connection is closed
      return () => clients.delete(controller);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const update = await request.json();
  
  // Broadcast to all connected clients
  const message = new TextEncoder().encode(`data: ${JSON.stringify(update)}\n\n`);
  clients.forEach((client: ReadableStreamController<Uint8Array>) => {
    client.enqueue(message);
  });

  return NextResponse.json({ success: true });
}
