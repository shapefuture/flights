import { loadStripe } from "@stripe/stripe-js"

// This is your test publishable API key.
// In a real application, you'd use environment variables
// to keep this secret.
const publishableKey = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || ""

const stripePromise = loadStripe(publishableKey)

export { stripePromise }