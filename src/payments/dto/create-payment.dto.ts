export class CreatePaymentDto {
    amount: number;
    currency: 'USD' | 'EUR' | 'USD';
    cryptoSymbol: string;
    cryptoAmount: number;
    customerId: string;
}
