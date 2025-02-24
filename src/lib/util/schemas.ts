import * as dayjs from 'dayjs';
import {z} from 'zod';

export const inputSchema = z
  .object({
    timestamp: z
      .string({
        required_error: "The 'timestamp' field is required",
        invalid_type_error: "The 'timestamp' field must be a string",
      })
      .refine(val => !isNaN(Date.parse(val)), {
        message: 'Invalid timestamp; must be a valid ISO date string',
      }),
    duration: z
      .number({
        required_error: "The 'duration' field is required",
        invalid_type_error: "The 'duration' field must be a number",
      })
      .positive('Invalid duration; must be a positive number')
      .refine(val => val >= 3600, {
        message: "Invalid duration: 'duration' must be greater than 3600",
      }),
    latitude: z
      .number({
        required_error: "The 'latitude' field is required",
        invalid_type_error: "The 'latitude' field must be a number",
      })
      .refine(val => !isNaN(val), {
        message: "The 'latitude' field must be a number",
      }),
    longitude: z
      .number({
        required_error: "The 'longitude' field is required",
        invalid_type_error: "The 'longitude' field must be a number",
      })
      .refine(val => !isNaN(val), {
        message: "The 'longitude' field must be a number",
      }),
  })
  .refine(data => {
    const start = dayjs(data.timestamp);
    const end = start.add(data.duration, 'second');
    return (
      end.diff(start, 'days') < 10,
      {
        message: 'The maximum duration is 10 days for the Electricity Maps API',
      }
    );
  });
