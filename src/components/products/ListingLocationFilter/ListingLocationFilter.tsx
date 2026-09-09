"use client";

import { useEffect, useId, useRef, useState } from "react";
import { normalizeSearchText } from "@/lib/productSearch";
import type { City } from "@/services/ibge/cities";

type ListingLocationFilterProps = {
  availableLocations: City[];
  initialCode: number | null;
  fieldClassName: string;
};

function formatCity(city: City) {
  return `${city.city}, ${city.state}`;
}

/** Seleção local de municípios do catálogo, sem carregar dados externos. */
export function ListingLocationFilter({ availableLocations, initialCode, fieldClassName }: ListingLocationFilterProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [query, setQuery] = useState(() => {
    const initialCity = availableLocations.find((city) => city.ibgeCode === initialCode);
    return initialCity ? formatCity(initialCity) : "";
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const unavailable = selectedCode !== null && !availableLocations.some((city) => city.ibgeCode === selectedCode);
  const terms = normalizeSearchText(query).replace(/,/g, " ").split(/\s+/).filter(Boolean);
  const suggestions = availableLocations.filter((city) =>
    selectedCode !== null || terms.every((term) => normalizeSearchText(`${city.city} ${city.state}`).includes(term)),
  ).slice(0, 8);
  const expanded = isOpen && suggestions.length > 0;

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      selectedCode === null && query.trim() ? "Selecione uma cidade das sugestões ou limpe a localização." : "",
    );
  }, [query, selectedCode]);

  function selectCity(city: City) {
    setSelectedCode(city.ibgeCode);
    setQuery(formatCity(city));
    setIsOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div className="relative min-w-0 flex-[2_1_20rem]" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">Localização</label>
      <div className="flex items-end gap-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-options`}
          aria-expanded={expanded}
          aria-activedescendant={expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-describedby={unavailable ? `${id}-status` : undefined}
          autoComplete="off"
          placeholder="Buscar cidade..."
          value={query}
          className={fieldClassName}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedCode(null);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => {
                if (!suggestions.length) return -1;
                if (index < 0) return event.key === "ArrowDown" ? 0 : suggestions.length - 1;
                return (index + (event.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length;
              });
            } else if (event.key === "Enter" && expanded && activeIndex >= 0) {
              event.preventDefault();
              selectCity(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setIsOpen(false);
              setActiveIndex(-1);
            }
          }}
        />
        {(selectedCode !== null || query) && (
          <button type="button" aria-label="Limpar localização" className="h-12 shrink-0 cursor-pointer rounded-lg px-2 text-sm text-[#58C447] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#58C447]" onClick={() => {
            setSelectedCode(null);
            setQuery("");
            setActiveIndex(-1);
            inputRef.current?.focus();
          }}>Limpar</button>
        )}
      </div>
      <input type="hidden" name="localizacao" value={selectedCode ?? ""} />
      {unavailable && <p id={`${id}-status`} className="mt-2 text-xs text-zinc-400">Localização indisponível (código {selectedCode}).</p>}
      {expanded && (
        <ul id={`${id}-options`} role="listbox" aria-label="Cidades disponíveis" className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
          {suggestions.map((city, index) => (
            <li key={city.ibgeCode} role="presentation">
              <button type="button" role="option" id={`${id}-option-${index}`} aria-selected={selectedCode === city.ibgeCode} tabIndex={-1}
                className={`w-full cursor-pointer rounded-lg px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-800 ${activeIndex === index ? "bg-zinc-800 text-white" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectCity(city)}>{formatCity(city)}</button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && !suggestions.length && <p role="status" className="mt-2 text-xs text-zinc-400">Nenhuma cidade disponível para esta busca.</p>}
    </div>
  );
}
