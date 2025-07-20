import type { Duration } from "./Duration";
import type { FlightAirport } from "./FlightAirport";

export interface FlightSegment {
    departureAirport: FlightAirport;
    arrivalAirport: FlightAirport;
    durationLabel: string;
    duration: Duration;
    airline: string;
    airlineLogo: string;
    flightNumber: string;
    aircraft: string;
    seat: string;
    legroom: string;
    extensions: string[];
}