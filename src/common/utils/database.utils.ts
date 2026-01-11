export const DEFAULT_CACHE = 60000;

import { camelCase } from "typeorm/util/StringUtils";

import { ClientError } from "../errors";
import { camelizeKeys } from "./general.utils";

type ResponseArgs = {
  message?: string | Record<string, string>;
  nameReplacements?: Record<string, string>;
};
export const duplicateErrorHandler = (
  error: any,
  responseArgs?: ResponseArgs,
) => {
  if (error?.code?.toString() !== "23505") {
    return error;
  }

  const { key, keys } = buildDatabaseDuplicateErrorArgs(error);

  const { message, nameReplacements = {} } = responseArgs || {};
  const name: string = camelizeKeys(nameReplacements)[key] || keys.join("/");

  let errorMessage = name
    ? `Duplicate record with same ${name} already exists.`
    : "Duplicate record already exists.";

  if (message) {
    if (typeof message === "string") {
      errorMessage = message;
    } else {
      errorMessage = camelizeKeys(message)[key] || errorMessage;
    }
  }

  throw new ClientError(errorMessage, 409);
};

export const buildDatabaseDuplicateErrorArgs = (error: any) => {
  const matches = error?.detail?.match(/Key \((.*)\)=\((.*)\)/);

  const [, keysPart, valuesPart] = matches;
  const values = valuesPart.split(",").map((v) => v.trim());
  const keys = keysPart?.split(",").map((x) => camelCase(x.trim()));

  const deletedTokenIndex = keys.findIndex((x) => x === "deletedTokenId");

  if (deletedTokenIndex > -1) {
    keys.splice(deletedTokenIndex, 1);
    values.splice(deletedTokenIndex, 1);
  }

  const key = camelCase(keys.join("_"));
  const value = values[0];

  return { keys, key, value };
};
