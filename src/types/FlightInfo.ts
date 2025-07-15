export interface FlightInfo {
    departure: string;
    destination: string;
    departureDate: string; // (YYYY-MM-DD)
    returnDate: string;    // (YYYY-MM-DD)
    passengers: number | null;
    flightClass: string | null;
    isRoundTrip: boolean;
}