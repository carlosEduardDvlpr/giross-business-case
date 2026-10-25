export interface CepResponse {
  cep: string;
  lat: string;
  lng: string;
}

export interface CepErrorResponse {
  code: "not_found";
  message: string;
}

export const API_CEP_BASE_URL = "https://cep.awesomeapi.com.br/json/";
