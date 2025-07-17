import React, { useRef, useState } from "react";

import AsyncSelect from "react-select/async";
import api from "../../services/api";
import type { Airport } from "../../types/Airport";

type Props = {
  //   toolIndex: number;
  //   onDateSelect: (range: DateRange, toolIndex) => void;
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

  const searchAirports = async (query: string) => {
    const response = await api.get(`airports/search/`, { params: { query } });
    const results: Airport[] = response.data;

    return results;
  };

  const promiseOptions = (inputValue: string) => {
    return new Promise<{ label: string; value: string, airport: Airport }[]>((resolve) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        const results = await searchAirports(inputValue);

        const options = results.map((airport) => ({
          value: airport.iataCode,
          label: `${airport.displayName}`,
          airport,
        }));

        resolve(options);
      }, 500);
    });
  };

  return (
    <>
      <AsyncSelect<AirportOption>
        className="basic-single"
        classNamePrefix="select"
        cacheOptions
        loadOptions={promiseOptions}
        placeholder={subtitle}
        onChange={(selected) => onSelect(selected?.airport ?? null)}
      />

      <div
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
