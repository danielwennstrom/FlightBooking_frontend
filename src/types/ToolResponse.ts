import type { Flight } from "./GoogleFlightsData/Flight";

export interface ToolResponse {
    type?: string;
    message?: string | null;
    data?: Flight[];
    isCompleted?: boolean;
}