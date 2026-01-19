import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { stripe } from 'src/utils/stripe';

@Injectable()
export class PaymentsService {
  async create(createPaymentDto: CreatePaymentDto) {
    const { cryptoSymbol, cryptoAmount, amount, customerId, currency } = createPaymentDto;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (!cryptoSymbol || !cryptoAmount) {
      throw new BadRequestException('Crypto details required');
    }

    let stripeCustomerId = customerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create();
      stripeCustomerId = customer.id;
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: '2025-12-18.acacia' },
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor(amount * 100),
      currency: currency.toLowerCase(),
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'crypto_purchase',
        cryptoSymbol,
        cryptoAmount: cryptoAmount.toString(),
      },
    });

    return {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: stripeCustomerId,
      publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    };
  }

  async findAll() {
    return `This action returns all payments`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  async remove(id: number) {
    return `This action removes a #${id} payment`;
  }

  async webhook(id: number) {
    return `This action removes a #${id} payment`;
  }
}
