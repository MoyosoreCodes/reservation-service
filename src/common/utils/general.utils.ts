import { camelCase } from "typeorm/util/StringUtils";
import { ZodError, ZodType } from "zod";

import logger from "../logger";

type ValidationResult<T> = {
  data: T | null;
  error: null | string | Record<string, string | string[]>;
};

export function validate<T>(
  schema: ZodType<T>,
  payload: unknown,
  options: {
    allowEmptyPayload: boolean;
  } = {
    allowEmptyPayload: false,
  },
): ValidationResult<T> {
  const isEmpty =
    payload == null ||
    (typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.keys(payload as Record<string, unknown>).length === 0);

  const { allowEmptyPayload } = options;
  if (!allowEmptyPayload && isEmpty) {
    return { data: null, error: "Payload is empty" };
  }

  const result = schema.safeParse(payload);
  if (result.success) return { data: result.data, error: null };

  const errorObj = handleZodError(result.error);
  return { data: null, error: errorObj };
}

export function handleZodError(error: unknown) {
  if (!(error instanceof ZodError)) return null;

  return error.issues.reduce<Record<string, string[]>>(
    (acc, { path, message }) => {
      const key = path.length ? String(path[0]) : "general";
      if (!acc[key]) acc[key] = [];
      acc[key].push(message);
      return acc;
    },
    {},
  );
}

export function validateEnv<T>(schema: ZodType<T>, configName?: string) {
  const { data, error } = validate(schema, process.env);
  if (data) return data;

  let errorMessage =
    "\n!IMPORTANT Kindly check .env file to fix errors below. \n";
  errorMessage += configName
    ? `Error validating ${configName} configuration`
    : "Error validating configuration";

  logger.error(errorMessage);
  logger.error(error);
  process.exit(1);
}

export function hasTimeRangeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && end1 > start2;
}

export function parseTimeToDate(date: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export const camelizeKeys = (obj: any): typeof obj => {
  if (obj instanceof Date || Buffer.isBuffer(obj)) return obj;

  if (Array.isArray(obj)) {
    return obj.map((x) => camelizeKeys(x));
  }

  if (typeof obj === "object") {
    return Object.keys(obj).reduce(
      (acc, curr) => {
        acc[camelCase(curr)] = obj[curr] && camelizeKeys(obj[curr]);
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  return obj;
};
