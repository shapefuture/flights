import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PricingCards } from '../pricing-cards';
import { subscriptionPlans, createCheckoutSession } from '../../../lib/stripe';
import { useAuth } from '../../../context/auth-context';

// Mock dependencies
jest.mock('../../../context/auth-context');
jest.mock('../../../lib/stripe', () => ({
  subscriptionPlans: [
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
    }
  ],
  createCheckoutSession: jest.fn(),
}));

// Mock useToast
jest.mock('../../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('PricingCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      subscription: null,
    });
  });
  
  it('renders pricing plans correctly', () => {
    render(<PricingCards />);
    
    // Check plan name and price
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    
    // Check features
    subscriptionPlans[0].features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });
  
  it('toggles between monthly and yearly pricing', () => {
    render(<PricingCards />);
    
    // Initially shows monthly price
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    
    // Toggle to yearly
    const toggleSwitch = screen.getByRole('switch');
    fireEvent.click(toggleSwitch);
    
    // Now shows yearly price
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('/year')).toBeInTheDocument();
  });
  
  it('initiates checkout when subscribe button is clicked', async () => {
    // Mock successful checkout session creation
    (createCheckoutSession as jest.Mock).mockResolvedValue('https://checkout.stripe.com/mock-url');
    
    render(<PricingCards />);
    
    // Click subscribe button
    const subscribeButton = screen.getByText('Subscribe');
    fireEvent.click(subscribeButton);
    
    // Verify checkout session is created with monthly price ID
    await waitFor(() => {
      expect(createCheckoutSession).toHaveBeenCalledWith(
        'price_basic_monthly',
        expect.any(String),
        expect.any(String),
        undefined
      );
    });
  });
  
  it('shows current plan when user already has subscription', () => {
    // Mock authenticated user with basic subscription
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id' },
      subscription: { tier: 'basic' },
    });
    
    render(<PricingCards />);
    
    // Check if "Current Plan" is shown instead of "Subscribe"
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Current Plan').closest('button')).toBeDisabled();
  });
  
  it('calls onSelectPlan when user is not authenticated', () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      subscription: null,
    });
    
    const onSelectPlanMock = jest.fn();
    render(<PricingCards onSelectPlan={onSelectPlanMock} />);
    
    // Click subscribe button
    const subscribeButton = screen.getByText('Subscribe');
    fireEvent.click(subscribeButton);
    
    // Verify onSelectPlan was called with the plan
    expect(onSelectPlanMock).toHaveBeenCalledWith(subscriptionPlans[0]);
  });
});