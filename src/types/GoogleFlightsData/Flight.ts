import type { Bags } from "./Bags";
import type { Delay } from "./Delay";
import type { Duration } from "./Duration";
import type { FlightSegment } from "./FlightSegment";
import type { Layover } from "./Layover";

export interface Flight {
    departure: string;
    arrival: string;
    duration: Duration;
    flights: FlightSegment[];
    layovers: Layover[];
    bags: Bags;
    price: number;
    stops: number;
    airlineLogo: string;
    nextToken: string;
    bookingToken: string;
    delay: Delay;
}