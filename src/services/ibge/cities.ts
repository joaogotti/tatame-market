const IBGE_CITIES_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

type IbgeState = {
  sigla: string;
};

/**
 * Recorte da resposta real do IBGE usado pela aplicação. A API disponibiliza
 * outros dados territoriais, mas eles não devem vazar para o domínio do projeto.
 */
type IbgeMunicipality = {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: IbgeState;
    };
  } | null;
  "regiao-imediata"?: {
    "regiao-intermediaria"?: {
      UF?: IbgeState;
    };
  } | null;
};

/** Estrutura normalizada que poderá ser persistida no Supabase futuramente. */
export type City = {
  ibgeCode: number;
  city: string;
  state: string;
};

let citiesRequest: Promise<City[]> | null = null;

function isIbgeMunicipality(value: unknown): value is IbgeMunicipality {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "nome" in value &&
    typeof value.nome === "string"
  );
}

function normalizeMunicipality(municipality: IbgeMunicipality): City | null {
  const state =
    municipality.microrregiao?.mesorregiao?.UF?.sigla ??
    municipality["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla;

  if (!state) {
    return null;
  }

  return {
    ibgeCode: municipality.id,
    city: municipality.nome,
    state,
  };
}

async function requestCities(): Promise<City[]> {
  const response = await fetch(IBGE_CITIES_URL);

  if (!response.ok) {
    throw new Error(`IBGE request failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("IBGE returned an invalid municipalities payload");
  }

  return payload
    .filter(isIbgeMunicipality)
    .map(normalizeMunicipality)
    .filter((city): city is City => city !== null)
    .sort((first, second) =>
      first.city.localeCompare(second.city, "pt-BR"),
    );
}

/**
 * Obtém e normaliza os municípios apenas uma vez por execução do cliente.
 * Em caso de falha, a Promise é limpa para permitir uma tentativa posterior.
 */
export function getCities(): Promise<City[]> {
  if (!citiesRequest) {
    citiesRequest = requestCities().catch((error: unknown) => {
      citiesRequest = null;
      throw error;
    });
  }

  return citiesRequest;
}
