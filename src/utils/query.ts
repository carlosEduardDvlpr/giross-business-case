import { AppError } from "../errors/app-error.js";

export function parseBooleanQuery(value: unknown, name: string) {
  if (value === undefined) {
    return false;
  }

  if (value === "true" || value === "false") {
    return value === "true";
  }

  throw new AppError(
    400,
    "Parâmetro inválido",
    `O parâmetro "${name}" aceita apenas true ou false.`,
  );
}
