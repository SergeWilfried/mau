import { Controller, Post, Body, Headers, Req, Res, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { verifyWebhookSignature } from './utils/webhook';
import { BridgeService } from './bridge.service';
import { ConfigService } from '@nestjs/config';
import { WebhookEvent } from './types';

@Controller('bridge')
export class BridgeController {
    private readonly logger = new Logger(BridgeController.name);
    private readonly webhookPublicKey: string;

    constructor(
        private readonly bridgeService: BridgeService,
        private readonly configService: ConfigService // Added 'private readonly'
    ) {
        this.webhookPublicKey = this.configService.get<string>('BRIDGE_WEBHOOK_PUBLIC_KEY');
    }

    @Post('webhook')
    async handleBridgeUpdate(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('x-webhook-signature') signatureHeader: string
    ) {
        // 1. Check for signature header
        if (!signatureHeader) {
            throw new HttpException('Missing signature header', HttpStatus.BAD_REQUEST);
        }

        // 2. Get Raw Body
        // Note: To use req.body as a Buffer, you must configure the RawBody middleware in main.ts
        const rawBody = req.body;

        // 3. Verify Signature
        const verification = verifyWebhookSignature(rawBody, signatureHeader, this.webhookPublicKey);

        if (!verification.isValid) {
            this.logger.error(`Signature verification failed: ${verification.error}`);
            return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid signature' });
        }

        try {
            // 4. Parse and process
            const event: WebhookEvent = JSON.parse(rawBody.toString());

            // We don't await this if we want to return 200 immediately to Bridge
            this.bridgeService
                .handleEvent(event)
                .catch((err) => this.logger.error(`Async event processing failed: ${err.message}`));

            return res.status(HttpStatus.OK).json({ received: true });
        } catch (error) {
            this.logger.error('Failed to parse or process webhook event:', error);
            return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid JSON' });
        }
    }
}
