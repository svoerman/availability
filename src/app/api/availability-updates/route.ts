import { NextResponse } from 'next/server';

const clients = new Set<ReadableStreamController<Uint8Array>>();

export function GET() {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      clients.add(controller);
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
  
  // Filter out closed connections while broadcasting
  for (const client of clients) {
    try {
      client.enqueue(message);
    } catch (error) {
      // Remove client if the connection is closed
      if (error instanceof Error && error.message.includes('Controller is already closed')) {
        clients.delete(client);
      } else {
        console.error('Error sending SSE message:', error);
      }
    }
  }

  return NextResponse.json({ success: true });
}
