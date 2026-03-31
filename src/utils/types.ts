import { z } from 'zod';

export const responseFormat = z.object({
  location_name: z.string().describe('City and country name, e.g. "Tokyo, Japan"'),
  forecast_summary: z
    .string()
    .describe('A concise, engaging weather summary for today and the coming week. Include temperature ranges, precipitation chances, and any notable trends.'),
  daily_outlook: z.string().optional().describe('Day-by-day breakdown of temperature highs/lows and conditions for the 7-day forecast period.'),
  weekly_climate_trend: z.string().optional().describe('Summary of how weather evolves across the week — warming, cooling, wetter, drier, etc.'),
  air_quality_summary: z.string().optional().describe('Air quality assessment including PM2.5, PM10, and CO levels with a plain-language health advisory.'),
});

export const responseFormat2 = z.object({
  answer: z.string().describe('Your primary conversational response to the user.'),
  weekly_trend: z.string().optional().describe('A summary of the weather/climate trend over the upcoming days.'),
});

export type ResponseFormat = z.infer<typeof responseFormat>;

// --- Geocoding ---
export const geocodingApiSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      elevation: z.number(),
      feature_code: z.string(),
      country_code: z.string(),
      admin1_id: z.number(),
      timezone: z.string(),
      population: z.number(),
      country_id: z.number(),
      country: z.string(),
      admin1: z.string(),
    }),
  ),
  generationtime_ms: z.number(),
});

export const geocodingSchema = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      country: z.string().optional(),
      timezone: z.string(),
    }),
  ),
});

export type GeocodingType = z.infer<typeof geocodingSchema>;

// --- Forecast ---
export const forecastApiSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  daily_units: z.object({
    time: z.string(),
    temperature_2m_max: z.string(),
    temperature_2m_min: z.string(),
    relative_humidity_2m_max: z.string(),
    precipitation_sum: z.string(),
    weathercode: z.string(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    relative_humidity_2m_max: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    weathercode: z.array(z.number()),
  }),
});

export const forecastSchema = z.object({
  timezone: z.string(),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    relative_humidity_2m_max: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    weathercode: z.array(z.number()),
  }),
});
export type ForecastType = z.infer<typeof forecastSchema>;

// --- Air Quality ---
export const airQualityApiSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  hourly_units: z.object({
    time: z.string(),
    pm2_5: z.string(),
    pm10: z.string(),
    carbon_monoxide: z.string(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    pm2_5: z.array(z.union([z.number(), z.null()])),
    pm10: z.array(z.union([z.number(), z.null()])),
    carbon_monoxide: z.array(z.union([z.number(), z.null()])),
  }),
});

export type AirQualityApiType = z.infer<typeof airQualityApiSchema>;

export const airQualitySchema = z.object({
  timezone: z.string(),
  daily_averages: z.array(
    z.object({
      date: z.string(),
      pm2_5_avg: z.number(),
      pm10_avg: z.number(),
      carbon_monoxide_avg: z.number(),
    }),
  ),
});

export type AirQualityType = z.infer<typeof airQualitySchema>;
