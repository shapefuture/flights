import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// This is your test publishable API key.
// For production, use env variable from import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(
  import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_stripe_publishable_key_placeholder'
);

export default stripePromise;