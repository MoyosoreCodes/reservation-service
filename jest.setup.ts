import { jest } from "@jest/globals";

import "reflect-metadata";

import * as GeneralUtils from "./src/common/utils/general.utils"; // Import the actual module

jest.mock("./src/common/utils/general.utils", () => {
  const actual = jest.requireActual(
    "./src/common/utils/general.utils",
  ) as typeof GeneralUtils;
  return {
    ...actual,
    validateEnv: jest.fn((_schema, _configName) => {
      return {
        DB_HOST: "localhost",
        DB_PORT: "5432",
        DB_USER: "testuser",
        DB_PASSWORD: "testpassword",
        DB_NAME: "testdb",
        DB_SYNCHRONIZE: "false",
        DB_LOGGING: "false",
        NODE_ENV: "test",
        REDIS_HOST: "localhost",
        REDIS_PORT: "6379",
      };
    }),
  };
});

jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn(() => Promise.resolve()),
  })),
}));
