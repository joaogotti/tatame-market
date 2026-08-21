"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { getCities, type City } from "@/services/ibge/cities";

const MAX_SUGGESTIONS = 8;

type LoadingStatus = "loading" | "ready" | "error";

function normalizeSearchTerm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function formatCity(city: City) {
  return `${city.city}, ${city.state}`;
}

/**
 * Autocomplete reutilizável de municípios brasileiros.
 * Somente este componente é client-side porque controla carregamento, busca e
 * seleção; o formulário e a página continuam como Server Components.
 */
export function LocationAutocomplete({
  initialCity,
  required = true,
  disabled = false,
}: {
  initialCity?: City;
  required?: boolean;
  disabled?: boolean;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [query, setQuery] = useState(() =>
    initialCity ? formatCity(initialCity) : "",
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(
    initialCity ?? null,
  );
  const [status, setStatus] = useState<LoadingStatus>("loading");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCities()
      .then((loadedCities) => {
        if (!isMounted) return;
        setCities(loadedCities);
        setStatus("ready");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      selectedCity || (!required && query.trim().length === 0)
        ? ""
        : "Selecione um município da lista de sugestões.",
    );
  }, [query, required, selectedCity]);

  const normalizedQuery = normalizeSearchTerm(query);
  const suggestions = useMemo(() => {
    if (
      status !== "ready" ||
      normalizedQuery.length < 2 ||
      selectedCity
    ) {
      return [];
    }

    return cities
      .filter((city) =>
        normalizeSearchTerm(`${city.city} ${city.state}`).includes(
          normalizedQuery,
        ),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [cities, normalizedQuery, selectedCity, status]);

  const showNoResults =
    isOpen &&
    status === "ready" &&
    normalizedQuery.length >= 2 &&
    suggestions.length === 0 &&
    !selectedCity;

  function handleRetry() {
    setStatus("loading");
    getCities()
      .then((loadedCities) => {
        setCities(loadedCities);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  function handleSelection(city: City) {
    setSelectedCity(city);
    setQuery(formatCity(city));
    setIsOpen(false);
  }

  return (
    <div
      className="relative sm:col-span-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <label
        htmlFor="location-search"
        className="text-sm font-medium text-zinc-300"
      >
        Localização
      </label>
      <input
        ref={inputRef}
        id="location-search"
        type="text"
        value={query}
        required={required}
        disabled={disabled || status !== "ready"}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen && suggestions.length > 0}
        aria-invalid={query.length > 0 && !selectedCity}
        placeholder={
          status === "loading" ? "Carregando municípios..." : "Digite uma cidade"
        }
        className="mt-2 w-full rounded-lg border border-zinc-700 bg-[#181B19] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#58C447] focus:ring-1 focus:ring-[#58C447] disabled:cursor-wait disabled:opacity-60"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedCity(null);
          setIsOpen(true);
        }}
      />

      {/* Campos estruturados impedem que texto livre seja persistido como cidade válida. */}
      <input
        type="hidden"
        name="locationIbgeCode"
        value={selectedCity?.ibgeCode ?? ""}
      />
      <input
        type="hidden"
        name="locationCity"
        value={selectedCity?.city ?? ""}
      />
      <input
        type="hidden"
        name="locationState"
        value={selectedCity?.state ?? ""}
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
        >
          {suggestions.map((city) => (
            <li key={city.ibgeCode} role="option" aria-selected="false">
              <button
                type="button"
                disabled={disabled}
                className="w-full rounded-lg px-4 py-3 text-left text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white focus:bg-zinc-800 focus:text-white focus:outline-none"
                onClick={() => handleSelection(city)}
              >
                {formatCity(city)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {status === "error" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-400">
          <span>Não foi possível consultar os municípios do IBGE.</span>
          <button
            type="button"
            disabled={disabled}
            className="font-medium text-zinc-200 underline underline-offset-2 hover:text-white"
            onClick={handleRetry}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {showNoResults && (
        <p className="mt-2 text-sm text-zinc-500">
          Nenhum município encontrado.
        </p>
      )}

      {selectedCity && (
        <p className="mt-2 text-sm text-[#58C447]">
          Localização selecionada: {formatCity(selectedCity)}
        </p>
      )}
    </div>
  );
}
