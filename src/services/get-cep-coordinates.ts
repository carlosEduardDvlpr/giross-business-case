import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";

interface AwesomeApiCepResponse {
  cep: string;
  lat: string;
  lng: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function getCepCoordinates(cep: string): Promise<Coordinates> {
  let response: Response;

  try {
    response = await fetch(`${env.geocodingApiUrl}${cep}`, {
      signal: AbortSignal.timeout(env.geocodingTimeoutMs),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new AppError(
        504,
        "Tempo de resposta excedido",
        "O serviço de geolocalização demorou demais para responder. Tente novamente mais tarde.",
      );
    }

    throw new AppError(
      503,
      "Serviço de geolocalização indisponível",
      "O serviço de geolocalização está temporariamente indisponível. Tente novamente mais tarde.",
    );
  }

  if (response.status === 400) {
    throw new AppError(
      400,
      "CEP inválido",
      "O CEP fornecido não é válido para o serviço de geolocalização.",
    );
  }

  if (response.status === 404) {
    throw new AppError(
      404,
      "CEP não encontrado",
      "O CEP fornecido não foi encontrado. Verifique o CEP e tente novamente.",
    );
  }

  if (response.status === 429) {
    throw new AppError(
      503,
      "Serviço de geolocalização indisponível",
      "O serviço de geolocalização atingiu o limite de requisições. Tente novamente em instantes.",
    );
  }

  if (!response.ok) {
    throw new AppError(
      502,
      "Erro ao consultar o serviço de geolocalização",
      "Ocorreu um erro ao consultar o serviço de geolocalização. Tente novamente mais tarde.",
    );
  }

  let data: AwesomeApiCepResponse | null;

  try {
    data = (await response.json()) as AwesomeApiCepResponse | null;
  } catch {
    throw new AppError(
      502,
      "Resposta inválida do serviço de geolocalização",
      "O serviço de geolocalização retornou uma resposta inválida. Tente novamente mais tarde.",
    );
  }

  const latitude = parseCoordinate(data?.lat, 90);
  const longitude = parseCoordinate(data?.lng, 180);

  if (latitude === null || longitude === null) {
    throw new AppError(
      422,
      "Coordenadas indisponíveis",
      "O CEP foi encontrado, mas o serviço de geolocalização não retornou coordenadas válidas para ele.",
    );
  }

  return { latitude, longitude };
}

// Number("") e Number(null) viram 0, por isso o valor vazio é rejeitado antes da conversão
function parseCoordinate(value: unknown, limit: number) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const coordinate = Number(value);

  if (!Number.isFinite(coordinate) || Math.abs(coordinate) > limit) {
    return null;
  }

  return coordinate;
}
