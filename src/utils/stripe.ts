import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  httpClient: Stripe.createFetchHttpClient(),
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2025-12-15.clover",
  appInfo: {
    name: "jamana dex",
  },
});