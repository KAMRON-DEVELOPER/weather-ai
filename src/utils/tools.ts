import { tool } from 'langchain';
import z from 'zod';
import { geocodingSchema, forecastSchema, airQualitySchema, airQualityApiSchema } from './types';

export const getCoordinates = tool(
  async ({ city }) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);

    const json = await res.json();
    const data = geocodingSchema.safeParse(json);

    if (!data.success) {
      throw new Error('Invalid coordinates response');
    }

    if (!data.data.results?.length) {
      throw new Error(`No results found for city: "${city}"`);
    }

    const first = data.data.results[0];

    console.log(`getCoordinates first: ${JSON.stringify(first)}`);

    return first;
  },
  {
    name: 'get_coordinates',
    description: 'Convert a city name into geographic coordinates (latitude, longitude) along with country and timezone.',
    schema: z.object({
      city: z.string().describe('The name of the city'),
    }),
  },
);

export const getWeather = tool(
  async ({ latitude, longitude }) => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: ['temperature_2m_max', 'temperature_2m_min', 'relative_humidity_2m_max', 'precipitation_sum', 'weathercode'].join(','),
      timezone: 'auto',
      forecast_days: '7',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const json = await res.json();
    const data = forecastSchema.safeParse(json);

    if (!data.success) {
      throw new Error('Invalid weather response');
    }

    console.log(`getWeather data.data: ${JSON.stringify(data.data)}`);

    return data.data;
  },
  {
    name: 'get_weather',
    description:
      'Fetch a 7-day daily weather forecast for a given latitude/longitude. Returns temperature highs/lows (°C), max relative humidity (%), total precipitation (mm), and WMO weather codes for each day. Use this to describe current conditions and weekly trends.',
    schema: z.object({
      latitude: z.number().describe('Latitude in decimal degrees'),
      longitude: z.number().describe('Longitude in decimal degrees'),
    }),
  },
);

export const getAirQuality = tool(
  async ({ latitude, longitude }) => {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: ['pm2_5', 'pm10', 'carbon_monoxide'].join(','),
      timezone: 'auto',
      forecast_days: '7',
    });

    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Air Quality API error: ${res.status}`);

    const json = await res.json();
    const data = airQualityApiSchema.safeParse(json);

    if (!data.success) {
      throw new Error('Invalid air quality response');
    }

    const {
      timezone,
      hourly: { time, pm2_5, pm10, carbon_monoxide },
    } = data.data;
    const daily_averages = aggregateDailyAverages(time, pm2_5, pm10, carbon_monoxide);

    console.log(`getAirQuality daily_averages: ${JSON.stringify(daily_averages)}`);

    return airQualitySchema.parse({
      timezone,
      daily_averages,
    });
  },
  {
    name: 'get_air_quality',
    description:
      'Fetch 7-day air quality data for a given latitude/longitude. Returns daily averages for PM2.5 (μg/m³), PM10 (μg/m³), and carbon monoxide (μg/m³). Use this to assess air quality and issue health advisories alongside the weather forecast.',
    schema: z.object({
      latitude: z.number().describe('Latitude in decimal degrees'),
      longitude: z.number().describe('Longitude in decimal degrees'),
    }),
  },
);

function aggregateDailyAverages(times: string[], pm2_5: (number | null)[], pm10: (number | null)[], carbon_monoxide: (number | null)[]) {
  const byDay: Record<string, { pm2_5: number[]; pm10: number[]; co: number[] }> = {};

  times.forEach((isoHour, i) => {
    const date = isoHour.slice(0, 10); // "YYYY-MM-DD"
    if (!byDay[date]) byDay[date] = { pm2_5: [], pm10: [], co: [] };
    const pm25v = pm2_5[i];
    const pm10v = pm10[i];
    const cov = carbon_monoxide[i];
    if (pm25v != null) byDay[date].pm2_5.push(pm25v);
    if (pm10v != null) byDay[date].pm10.push(pm10v);
    if (cov != null) byDay[date].co.push(cov);
  });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return Object.entries(byDay).map(([date, vals]) => ({
    date,
    pm2_5_avg: Math.round(avg(vals.pm2_5) * 10) / 10,
    pm10_avg: Math.round(avg(vals.pm10) * 10) / 10,
    carbon_monoxide_avg: Math.round(avg(vals.co) * 10) / 10,
  }));
}
