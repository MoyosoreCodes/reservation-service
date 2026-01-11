import swaggerJSDoc from "swagger-jsdoc";

import { ApplicationConfig } from "./server.config";

export function getSwaggerSpec(config: ApplicationConfig) {
  const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
      title: config.name,
      version: config.version,
      description: config.description,
      license: {
        name: config.license,
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: `${config.environment} server`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {},
    },
  };

  const options = {
    swaggerDefinition,
    apis: ["./src/routes/*.ts", "./src/common/dto/*.ts", "./src/entities/*.ts"],
  };

  return swaggerJSDoc(options);
}
