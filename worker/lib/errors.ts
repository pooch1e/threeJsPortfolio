/**
 * Shared error types
 * To mirror go idiom, use as .then.catch() on awaits
 */
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: ContentfulStatusCode,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class UserNotFoundError extends AppError {
  constructor(message = "User not found") {
    super(message, 404);
  }
}

export class DuplicateFoundError extends AppError {
  constructor(message = "Already exists") {
    super(message, 409);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid credentials", 401);
  }
}
