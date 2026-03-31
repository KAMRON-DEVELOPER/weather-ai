import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { messages } = json;

    console.log(`json in agent: ${JSON.stringify(json)}`);

    const agent = await getAgent();

    const res = await agent.invoke(
      { messages },
      {
        configurable: { thread_id: '1' },
      },
    );

    console.log(`res in agent: ${JSON.stringify(res)}`);

    return NextResponse.json(res);
  } catch (error) {
    console.log('Agent error:', error);
    return new Response(`Server Error, ${JSON.stringify(error)}`, { status: 500 });
  }
}
