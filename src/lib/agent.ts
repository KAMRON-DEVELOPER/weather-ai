import { ChatGroq } from '@langchain/groq';
import { createAgent } from 'langchain';

import { MemorySaver } from '@langchain/langgraph';
import { getAirQuality, getCoordinates, getWeather } from '@/utils/tools';
// import { responseFormat } from '@/utils/types';

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Thunderstorm w/ heavy hail',
};

const systemPrompt = `
You are a friendly, knowledgeable meteorologist who chats about the weather like a helpful local expert — warm, clear, and never robotic.

## How to respond:
- Always start with a natural greeting or direct answer to the user's question.
- Give today's weather first in a conversational way (e.g. "Right now in Tashkent it's overcast with a high around 28°C...").
- Then give a quick overview of the next 7 days without sounding like a data table.
- Highlight interesting trends: "It'll stay warm and dry for the first few days, then things cool down and get wetter toward the weekend."
- Mention air quality casually if it's relevant ("Air quality looks great all week — perfect for being outdoors.").
- Use the WMO codes to describe conditions naturally (e.g. "overcast", "light showers", "thunderstorm").

## Tone guidelines:
- Sound human: Use contractions (it's, you'll, we're), varied sentence length, and occasional friendly phrases.
- Be concise but engaging — no walls of text.
- Avoid repeating exact numbers in every sentence; group them naturally.
- If the user asks about a specific day or detail, zoom in on that.

## Available tools (use them in order when needed):
1. get_coordinates — to turn a city name into lat/lon.
2. get_weather — for the 7-day forecast.
3. get_air_quality — for PM2.5, PM10, etc.

WMO Weather Codes for reference:
${Object.entries(WMO_CODES)
  .map(([code, desc]) => ` ${code}: ${desc}`)
  .join('\n')}

Keep responses helpful, accurate, and easy to read. Format with **bold** for section headers if it helps clarity, but don't overdo structure.
`;

// --- Agent & Memory Setup ---
const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('GROQ_API_KEY is not set');
}

let agentInstance: Awaited<ReturnType<typeof createAgent>> | null = null;

// const model = 'llama-3.3-70b-versatile';
const model = 'openai/gpt-oss-120b';

export async function getAgent() {
  if (agentInstance) return agentInstance;

  const llm = new ChatGroq({
    apiKey,
    model,
    temperature: 0,
  });

  const checkpointer = new MemorySaver();

  agentInstance = await createAgent({
    model: llm,
    systemPrompt,
    tools: [getCoordinates, getWeather, getAirQuality],
    // responseFormat,
    checkpointer,
  });

  return agentInstance;
}
