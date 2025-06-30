/**
 * MUP Message Parser
 * Utility class for parsing and serializing MUP protocol v1 messages
 */
import { MUPMessage, UIRequest, UIResponse, EventTrigger, ErrorMessage, MessageType } from '@muprotocol/types';
/**
 * Message parser class for handling MUP protocol messages
 */
export declare class MessageParser {
    /**
     * Parse a JSON string into a MUP message
     * @param jsonString - JSON string to parse
     * @returns Parsed MUP message
     * @throws Error if parsing fails or message is invalid
     */
    static parse(jsonString: string): UIRequest | UIResponse | EventTrigger | ErrorMessage;
    /**
     * Serialize a MUP message to JSON string
     * @param message - MUP message to serialize
     * @returns JSON string representation
     */
    static serialize(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): string;
    /**
     * Validate if an object is a valid MUP message
     * @param obj - Object to validate
     * @returns True if valid MUP message
     */
    static isValidMessage(obj: any): obj is MUPMessage;
    /**
     * Extract message type from a JSON string without full parsing
     * @param jsonString - JSON string
     * @returns Message type or null if invalid
     */
    static getMessageType(jsonString: string): MessageType | null;
    /**
     * Extract message ID from a JSON string without full parsing
     * @param jsonString - JSON string
     * @returns Message ID or null if invalid
     */
    static getMessageId(jsonString: string): string | null;
    /**
     * Extract payload from a JSON string without full parsing
     * @param jsonString - JSON string
     * @returns Payload or null if invalid
     */
    static getPayload(jsonString: string): any | null;
}
//# sourceMappingURL=message-parser.d.ts.map