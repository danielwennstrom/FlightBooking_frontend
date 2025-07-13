import { Sender } from "./Sender";

export interface Message {
    id: string;
    content: string;
    sender: Sender;
    timestamp?: Date;
    isTyping?: boolean;
}