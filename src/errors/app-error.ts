export class AppError extends Error {
  readonly statusCode: number;
  readonly title: string;
  readonly retryAfterInSeconds?: number;

  constructor(
    statusCode: number,
    title: string,
    message: string,
    retryAfterInSeconds?: number,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.title = title;
    this.retryAfterInSeconds = retryAfterInSeconds;
  }
}
