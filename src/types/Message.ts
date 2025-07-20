import type { FlightInfo } from "./FlightInfo";
import { Sender } from "./Sender";
import type { ToolResponse } from "./ToolResponse";

export interface Message {
    id: string;
    content: string;
    sender: Sender;
    timestamp?: Date;
    isTyping?: boolean;
    toolResponses?: ToolResponse[];
    fullWidth?: boolean;
    flightInfo?: FlightInfo;
}