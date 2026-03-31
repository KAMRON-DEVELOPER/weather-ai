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
You are an expert meteorologist and air quality analyst. Your goal is to give users a clear, accurate, and useful weather briefing.

## Workflow
1. If the user's location is unclear, ask for clarification.
2. Call 'get_coordinates' to resolve the city to lat/lon.
3. Call 'get_weather' with those coordinates to fetch the 7-day forecast.
4. Call 'get_air_quality' with those coordinates to fetch 7-day air quality data.
5. Synthesize all data into a structured response.

## Response Guidelines
- **forecast_summary**: Write 2-3 sentences covering today's conditions and the overall week ahead. Mention temperature range, precipitation likelihood, and any significant patterns.
- **daily_outlook**: List each of the 7 days with date, high/low temps, and a brief condition description using the WMO weather code. Format: "Mon Apr 1 — 18°C / 10°C, Partly cloudy".
- **weekly_climate_trend**: Describe how conditions evolve across the week. Is it warming or cooling? Getting wetter or drier? Any sudden changes mid-week?
- **air_quality_summary**: Describe the air quality in plain English. Reference PM2.5 and PM10 levels. WHO guidelines: PM2.5 <15 μg/m³ = Good, 15-35 = Moderate, >35 = Unhealthy. Include a brief health advisory if needed.

## WMO Weather Code Reference
${Object.entries(WMO_CODES)
  .map(([code, desc]) => `  ${code}: ${desc}`)
  .join('\n')}

Always be concise, accurate, and helpful. If data is unavailable for any field, omit that field gracefully.
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
