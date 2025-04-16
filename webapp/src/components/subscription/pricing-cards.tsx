import React, { useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { subscriptionPlans, SubscriptionPlan, createCheckoutSession } from '../../lib/stripe';
import { useAuth } from '../../context/auth-context';
import { useToast } from '../ui/use-toast';

interface PricingCardsProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
}

export function PricingCards({ onSelectPlan }: PricingCardsProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { subscription, user } = useAuth();
  const { toast } = useToast();
  
  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      if (onSelectPlan) {
        onSelectPlan(plan);
      }
      return;
    }
    
    setIsLoading(plan.id);
    
    try {
      // Get price ID based on billing interval
      const priceId = billingInterval === 'monthly' 
        ? plan.stripePriceId.monthly 
        : plan.stripePriceId.yearly;
      
      // Create checkout URL (in real app would redirect to Stripe)
      const successUrl = `${window.location.origin}/subscription-success?plan=${plan.id}&interval=${billingInterval}`;
      const cancelUrl = `${window.location.origin}/pricing`;
      
      const checkoutUrl = await createCheckoutSession(
        priceId,
        successUrl,
        cancelUrl,
        subscription?.stripeCustomerId
      );
      
      if (checkoutUrl) {
        // In a real app this would redirect to Stripe
        toast({
          title: "Redirecting to checkout",
          description: `You would now be redirected to Stripe to complete your ${plan.name} plan subscription`
        });
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };
  
  // Check if user has current plan
  const hasCurrentPlan = (planId: string) => {
    return subscription?.tier === planId;
  };
  
  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          <Label htmlFor="billing-toggle">Monthly</Label>
          <Switch
            id="billing-toggle"
            checked={billingInterval === 'yearly'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'yearly' : 'monthly')}
          />
          <Label htmlFor="billing-toggle" className="flex items-center">
            Yearly <span className="ml-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-100">Save 17%</span>
          </Label>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={
              plan.id === 'premium' 
                ? 'border-blue-500 shadow-md dark:border-blue-900' 
                : ''
            }
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  ${billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                </span>
                <span className="text-muted-foreground">
                  /{billingInterval === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-blue-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSelectPlan(plan)}
                variant={plan.id === 'premium' ? 'default' : 'outline'}
                className="w-full"
                disabled={isLoading === plan.id || hasCurrentPlan(plan.id)}
              >
                {isLoading === plan.id ? 'Loading...' : hasCurrentPlan(plan.id) ? 'Current Plan' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-center text-sm text-muted-foreground">
        <Info className="mr-1 h-4 w-4" />
        <span>Prices shown exclude applicable taxes</span>
      </div>
    </div>
  );
}