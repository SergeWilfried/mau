export interface WebhookEvent {
    api_version: string;
    event_id: string;
    event_category: string;
    event_type: string;
    event_object: Record<string, any>;
    event_object_changes?: Record<string, any>;
    event_created_at: string;
    event_object_status: string;
    event_object_id: string;
}

export interface SignatureVerificationResult {
    isValid: boolean;
    error?: string;
}
