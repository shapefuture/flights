import { loadStripe, Stripe } from '@stripe/stripe-js';

// SubscriptionPlan type
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  monthlyQuota: number;
  stripePriceId: {
    monthly: string;
    yearly: string;
  };
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for casual travelers',
    features: ['20 searches per month', 'Basic flight details', 'Email support'],
    priceMonthly: 4.99,
    priceYearly: 49.99,
    monthlyQuota: 20,
    stripePriceId: {
      monthly: 'price_basic_monthly',
      yearly: 'price_basic_yearly',
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'For frequent travelers',
    features: [
      '100 searches per month',
      'Detailed flight information',
      'Price alerts',
      'Trip planning features',
      'Priority support',
    ],
    priceMonthly: 9.99,
    priceYearly: 99.99,
    monthlyQuota: 100,
    stripePriceId: {
      monthly: 'price_premium_monthly',
      yearly: 'price_premium_yearly',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For travel professionals',
    features: [
      'Unlimited searches',
      'All premium features',
      'API access',
      'Team collaboration',
      '24/7 dedicated support',
    ],
    priceMonthly: 29.99,
    priceYearly: 299.99,
    monthlyQuota: 10000, // Effectively unlimited
    stripePriceId: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly',
    },
  },
];

// Helper: get Stripe instance
let stripePromise: Promise<Stripe | null> | undefined;
export function getStripe() {
  if (!stripePromise) {
    const key =
      import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY ||
      'pk_test_stripe_publishable_key_placeholder';
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerId?: string
): Promise<string | null> {
  // Example: Should use actual endpoint or API
  return `https://checkout.stripe.com/mock-session?price=${priceId}`;
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  // Example: Should use actual endpoint or API
  return `https://billing.stripe.com/mock-portal?customer=${customerId}`;
}

export default getStripe;