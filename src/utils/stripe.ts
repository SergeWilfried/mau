import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2025-12-18.acacia",
  appInfo: {
    name: "jamana dex",
  },
});