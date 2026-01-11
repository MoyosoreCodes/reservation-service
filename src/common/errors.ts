export class ClientError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.isOperational = true;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ContentNotFoundError extends ClientError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode);
  }
}

export class ValidationError extends ClientError {
  public readonly errors: string | Record<string, string | string[]>;

  constructor(
    message: string,
    errors: string | Record<string, string | string[]>,
    statusCode: number = 400,
  ) {
    super(message, statusCode);
    this.errors = errors;
  }
}
