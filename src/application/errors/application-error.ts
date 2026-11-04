// Errors raised by the use cases. They describe what went wrong without
// knowing about HTTP; the infrastructure layer maps them to status codes.
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// A referenced resource does not exist
export class NotFoundError extends ApplicationError {}

// The request is valid but conflicts with the current state
// (duplicates, overlaps, resources in use)
export class ConflictError extends ApplicationError {}
