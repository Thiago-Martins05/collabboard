import Stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";

export const stripe = (() => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("Stripe não configurado - STRIPE_SECRET_KEY não encontrada");
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-07-30.basil",
  });
})();

export const getStripe = () => {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.warn(
      "Stripe não configurado - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não encontrada"
    );
    return null;
  }
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Planos disponíveis
export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    limits: {
      boards: 5,
      members: 5,
      columns: 10,
      cards: 5, // 5 cards no total para plano free
      labels: 20,
    },
  },
  PRO: {
    name: "Pro",
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: {
      boards: -1,
      members: 50,
      columns: 50,
      cards: -1,
      labels: 100,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;
