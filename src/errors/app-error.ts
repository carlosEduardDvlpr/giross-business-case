export class AppError extends Error {
  readonly statusCode: number;
  readonly title: string;

  constructor(statusCode: number, title: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.title = title;
  }
}
