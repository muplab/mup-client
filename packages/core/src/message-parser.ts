/**
 * MUP Message Parser
 * Utility class for parsing and serializing MUP protocol v1 messages
 */

import {
  MUPMessage,
  UIRequest,
  UIResponse,
  EventTrigger,
  ErrorMessage,
  MessageType
} from '@muprotocol/types';

/**
 * Message parser class for handling MUP protocol messages
 */
export class MessageParser {
  /**
   * Parse a JSON string into a MUP message
   * @param jsonString - JSON string to parse
   * @returns Parsed MUP message
   * @throws Error if parsing fails or message is invalid
   */
  static parse(jsonString: string): UIRequest | UIResponse | EventTrigger | ErrorMessage {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate basic message structure
      if (!this.isValidMessage(parsed)) {
        throw new Error('Invalid MUP message structure');
      }

      return parsed as UIRequest | UIResponse | EventTrigger | ErrorMessage;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Serialize a MUP message to JSON string
   * @param message - MUP message to serialize
   * @returns JSON string
   */
  static serialize(message: UIRequest | UIResponse | EventTrigger | ErrorMessage): string {
    try {
      return JSON.stringify(message);
    } catch (error) {
      throw new Error(`Failed to serialize message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate if an object is a valid MUP message
   * @param obj - Object to validate
   * @returns True if valid MUP message
   */
  static isValidMessage(obj: any): obj is MUPMessage {
    if (!obj || typeof obj !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['version', 'message_id', 'timestamp', 'type', 'payload'];
    for (const field of requiredFields) {
      if (!(field in obj)) {
        return false;
      }
    }

    // Validate field types
    if (typeof obj.version !== 'string' ||
        typeof obj.message_id !== 'string' ||
        typeof obj.timestamp !== 'string' ||
        typeof obj.type !== 'string' ||
        typeof obj.payload !== 'object') {
      return false;
    }

    // Validate message type
    const validTypes: MessageType[] = ['ui_request', 'ui_response', 'event_trigger', 'error'];
    if (!validTypes.includes(obj.type as MessageType)) {
      return false;
    }

    // Validate timestamp format (ISO 8601)
    try {
      const date = new Date(obj.timestamp);
      if (isNaN(date.getTime())) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Extract message type from a JSON string without full parsing
   * @param jsonString - JSON string
   * @returns Message type or null if invalid
   */
  static getMessageType(jsonString: string): MessageType | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed.type === 'string') {
        const validTypes: MessageType[] = ['ui_request', 'ui_response', 'event_trigger', 'error'];
        return validTypes.includes(parsed.type as MessageType) ? parsed.type as MessageType : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract message ID from a JSON string without full parsing
   * @param jsonString - JSON string
   * @returns Message ID or null if invalid
   */
  static getMessageId(jsonString: string): string | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed.message_id === 'string') {
        return parsed.message_id;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract payload from a JSON string without full parsing
   * @param jsonString - JSON string
   * @returns Payload or null if invalid
   */
  static getPayload(jsonString: string): any | null {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.payload !== undefined) {
        return parsed.payload;
      }
      return null;
    } catch {
      return null;
    }
  }
}