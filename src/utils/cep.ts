import { AppError } from "../errors/app-error.js";

const CEP_PATTERN = /^\d{5}-?\d{3}$/;

export function normalizeCep(value: string) {
  const cep = value.trim();

  if (!CEP_PATTERN.test(cep)) {
    throw new AppError(
      400,
      "CEP inválido",
      "O CEP fornecido não é válido. Certifique-se de fornecer um CEP com 8 dígitos numéricos.",
    );
  }

  return cep.replace("-", "");
}
