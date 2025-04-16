import { loadStripe, Stripe } from '@stripe/stripe-js';
import { debug, error } from '../utils/logger';

let stripePromise: Promise<Stripe | null>;

// Get Stripe instance
export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      error('Missing Stripe publishable key');
      throw new Error('Missing Stripe publishable key');
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Subscription plans
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
    features: [
      '20 searches per month',
      'Basic flight details',
      'Email support',
    ],
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

// Create Stripe checkout session
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerId?: string
): Promise<string | null> {
  try {
    // In a real app, this would be a serverless function call
    // Here we're mocking it for demonstration
    
    debug('Creating checkout session', { priceId, customerId });
    
    // Mock checkout session URL for demo purposes
    const sessionUrl = `https://checkout.stripe.com/mock-session?price=${priceId}`;
    
    return sessionUrl;
  } catch (err) {
    error('Error creating checkout session:', err);
    return null;
  }
}

// Create customer portal session
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  try {
    // In a real app, this would be a serverless function call
    // Here we're mocking it for demonstration
    
    debug('Creating customer portal session', { customerId });
    
    // Mock portal URL for demo purposes
    const portalUrl = `https://billing.stripe.com/mock-portal?customer=${customerId}`;
    
    return portalUrl;
  } catch (err) {
    error('Error creating customer portal session:', err);
    return null;
  }
}