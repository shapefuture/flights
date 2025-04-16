import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import { AuthDialog } from '../components/auth/auth-dialog';
import { PricingCards } from '../components/subscription/pricing-cards';
import { ManageSubscription } from '../components/subscription/manage-subscription';
import { SubscriptionPlan } from '../lib/stripe';

export function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setAuthDialogOpen(true);
  };
  
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
          Choose the plan that works best for you. All plans include access to our AI-powered flight finding tools.
        </p>
      </div>
      
      <div className="mt-12">
        {isAuthenticated ? (
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <PricingCards />
            </div>
            <div>
              <ManageSubscription />
            </div>
          </div>
        ) : (
          <PricingCards onSelectPlan={handleSelectPlan} />
        )}
      </div>
      
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        defaultTab="sign-up"
      />
    </div>
  );
}