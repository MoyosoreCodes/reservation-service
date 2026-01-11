import { config } from "dotenv";
config({ path: ".env" });

import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import "reflect-metadata";

import logger from "./src/common/logger";
import { initDatabase } from "./src/config/database.config";
import { getServerConfig } from "./src/config/server.config";
import { getSwaggerSpec } from "./src/config/swagger.config";
import { errorHandler } from "./src/middleware/error.middleware";
import routes from "./src/routes";

const fullConfig = getServerConfig();
const { name, port, swagger } = fullConfig;
const server = express();

server.use(helmet());

server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

server.use(express.json());
server.use(express.urlencoded({ extended: false }));

if (swagger.enabled === "true") {
  try {
    const swaggerSpec = getSwaggerSpec(fullConfig);
    server.get("/swagger.json", (_req, res) => res.json(swaggerSpec));
    server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  } catch (error) {
    logger.error({ error }, "Failed to generate Swagger Spec");
  }
}

server.use("/api", routes);

server.use((req, res, _next) => {
  logger.info(`Resource ${req.url} not found`);
  res.status(404).json({ message: "Resource Not Found" });
});

server.use(errorHandler);

const app = server.listen(port, () => {
  logger.info(`Server(${name}) running on port ${port}`);
});

initDatabase()
  .then(() => {
    logger.info("Database initialization complete");
  })
  .catch((err) => {
    logger.error(err);
  });

process.on("SIGINT", async () => {
  app.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, _) => {
  logger.error(`Unhandled Rejection at: ${reason}`);
  process.exit(1);
});
