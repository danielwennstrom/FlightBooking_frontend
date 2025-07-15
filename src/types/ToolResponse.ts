import type { FlightInfo } from "./FlightInfo";

export interface ToolResponse {
    type?: string;
    message?: string | null;
    data?: FlightInfo;
    isCompleted?: boolean;
}