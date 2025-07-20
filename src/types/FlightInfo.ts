import type { Flight } from "./GoogleFlightsData/Flight";

export interface FlightInfo {
  departure: string;
  destination: string;
  departureDate: string; // (YYYY-MM-DD)
  returnDate: string; // (YYYY-MM-DD)
  passengers: number | null;
  cabinClass: string | null;
  isRoundTrip: boolean;
  departureFlight?: Flight;
  returnFlight?: Flight;
}
