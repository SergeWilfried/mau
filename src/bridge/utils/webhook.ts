import crypto from 'crypto';
import { SignatureVerificationResult, WebhookEvent } from '../types';

export function verifyWebhookSignature(
    payload: Buffer,
    signatureHeader: string,
    publicKey: string
): SignatureVerificationResult {
    try {
        // Parse signature header
        const signatureParts = signatureHeader.split(',');
        const timestamp = signatureParts.find((part) => part.startsWith('t='))?.split('=')[1];
        const signature = signatureParts.find((part) => part.startsWith('v0='))?.split('=')[1];

        if (!timestamp || !signature) {
            return { isValid: false, error: 'Missing timestamp or signature' };
        }

        // Check timestamp (reject events older than 10 minutes)
        const currentTime = Date.now();
        if (currentTime - parseInt(timestamp) > 600000) {
            return { isValid: false, error: 'Timestamp too old' };
        }

        // Create signed payload
        const signedPayload = `${timestamp}.${payload.toString()}`;

        // Create a SHA256 digest of the signed payload
        const digest = crypto.createHash('sha256').update(signedPayload).digest();

        // Verify signature
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(digest);
        const isValid = verifier.verify(publicKey, signature, 'base64');

        return { isValid };
    } catch (error) {
        return { isValid: false, error: `Verification failed: ${error.message}` };
    }
}
