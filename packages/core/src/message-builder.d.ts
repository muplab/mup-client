/**
 * MUP Message Builder
 * Utility class for building MUP protocol v1 messages
 */
import { UIRequest, UIResponse, EventTrigger, ErrorMessage, UIRequestPayload, UIResponsePayload, EventTriggerPayload, ErrorPayload } from '@muprotocol/types';
/**
 * Message builder class for creating MUP protocol messages
 */
export declare class MessageBuilder {
    /**
     * Create a UI request message
     * @param payload - UI request payload
     * @param messageId - Optional custom message ID
     * @returns UI request message
     */
    static createUIRequest(payload: UIRequestPayload, messageId?: string): UIRequest;
    /**
     * Create a UI response message
     * @param payload - UI response payload
     * @param messageId - Optional custom message ID
     * @returns UI response message
     */
    static createUIResponse(payload: UIResponsePayload, messageId?: string): UIResponse;
    /**
     * Create an event trigger message
     * @param payload - Event trigger payload
     * @param messageId - Optional custom message ID
     * @returns Event trigger message
     */
    static createEventTrigger(payload: EventTriggerPayload, messageId?: string): EventTrigger;
    /**
     * Create an error message
     * @param payload - Error payload
     * @param messageId - Optional custom message ID
     * @returns Error message
     */
    static createError(payload: ErrorPayload, messageId?: string): ErrorMessage;
    /**
     * Create a success UI response
     * @param components - Generated components
     * @param messageId - Optional custom message ID
     * @returns Success UI response message
     */
    static createSuccessResponse(components: UIResponsePayload['components'], messageId?: string): UIResponse;
    /**
     * Create an error UI response
     * @param error - Error information
     * @param messageId - Optional custom message ID
     * @returns Error UI response message
     */
    static createErrorResponse(error: {
        code: string;
        message: string;
        details?: any;
    }, messageId?: string): UIResponse;
}
//# sourceMappingURL=message-builder.d.ts.map