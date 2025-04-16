import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { UseageMeter } from './usage-meter';
import { useAuth } from '../../context/auth-context';
import { createCustomerPortalSession } from '../../lib/stripe';
import { useToast } from '../ui/use-toast';
import { CreditCard, ExternalLink } from 'lucide-react';

export function ManageSubscription() {
  const { subscription, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  if (!subscription || !user) {
    return null;
  }
  
  const handleManageSubscription = async () => {
    if (!subscription.stripeCustomerId) {
      toast({
        title: "Missing customer ID",
        description: "Unable to manage subscription without a Stripe customer ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const portalUrl = await createCustomerPortalSession(
        subscription.stripeCustomerId,
        window.location.origin
      );
      
      if (portalUrl) {
        // In a real app this would redirect to Stripe Customer Portal
        toast({
          title: "Redirecting to customer portal",
          description: "You would now be redirected to manage your subscription"
        });
      } else {
        throw new Error("Failed to create customer portal session");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to access subscription portal. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format tier name with proper capitalization
  const formatTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Subscription</CardTitle>
        <CardDescription>
          Manage your subscription and usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{formatTier(subscription.tier)} Plan</h3>
              <p className="text-sm text-muted-foreground">
                Active until {formatDate(subscription.validUntil)}
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        
        <UseageMeter />
        
        <div className="text-sm">
          <p>Need more searches? Upgrade your plan or wait until your quota resets next month.</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleManageSubscription}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Manage Subscription'}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}