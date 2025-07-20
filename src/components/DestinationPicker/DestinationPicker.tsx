import React, { useEffect, useRef, useState } from "react";

import AsyncSelect from "react-select/async";
import api from "../../services/api";
import type { Airport } from "../../types/Airport";

type Props = {
  subtitle: string;
  onSelect: (airport: Airport | null) => void;
};

type AirportOption = {
  label: string;
  value: string;
  airport: Airport;
};

const DestinationPicker = ({ subtitle, onSelect }: Props) => {
  const timeoutRef = useRef<number>();
  const [initialOptions, setInitialOptions] = useState<AirportOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState<AirportOption | null>(
    null
  );

  useScrollOnOpen(isOpen, bottomRef);

  const searchAirports = async (query: string, limit?: number) => {
    let response = null;

    if (query === "" && limit) {
      response = await api.get(`airports/${limit}`);
    } else {
      response = await api.get(`airports/search/`, { params: { query } });
    }
    const results: Airport[] = response.data;

    return results;
  };

  const toOption = (airport: Airport): AirportOption => ({
    value: airport.iataCode,
    label: airport.displayName,
    airport,
  });

  const promiseOptions = (inputValue: string) => {
    return new Promise<AirportOption[]>((resolve) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(async () => {
        const results = await searchAirports(inputValue);
        resolve(results.map(toOption));
      }, 500);
    });
  };

  useEffect(() => {
    (async () => {
      const results = await searchAirports("", 100);
      setInitialOptions(results.map(toOption));
    })();
  }, []);

  function useScrollOnOpen(
    isOpen: boolean,
    ref: React.RefObject<HTMLDivElement> | null
  ) {
    useEffect(() => {
      if (ref !== null && isOpen) {
        ref.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, [isOpen, ref]);
  }

  return (
    <>
      <AsyncSelect<AirportOption>
        className="basic-single"
        classNamePrefix="select"
        cacheOptions
        value={selectedOption}
        loadOptions={promiseOptions}
        defaultOptions={initialOptions}
        placeholder={subtitle}
        onChange={(selected) => {
          setSelectedOption(selected);
          onSelect(selected?.airport ?? null);
          console.log(selected);
        }}
        onMenuOpen={() => setIsOpen(true)}
        onMenuClose={() => setIsOpen(false)}
      />

      <div
        ref={bottomRef}
        style={{
          color: "hsl(0, 0%, 40%)",
          display: "inline-block",
          fontSize: 12,
          fontStyle: "italic",
          marginTop: "1em",
        }}
      ></div>
    </>
  );
};

export default DestinationPicker;
