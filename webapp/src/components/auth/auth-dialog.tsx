import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { GoogleSignInButton } from './google-sign-in-button';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { debug, info, error as logError } from '../../utils/logger';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'sign-in' | 'sign-up';
}

export function AuthDialog({ 
  open, 
  onOpenChange,
  defaultTab = 'sign-in'
}: AuthDialogProps) {
  const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up'>(defaultTab);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Clear any errors when the dialog opens or closes
  useEffect(() => {
    setAuthError(null);
  }, [open]);
  
  const toggleEmailAuth = () => {
    setShowEmailAuth(!showEmailAuth);
    debug(`Email auth toggled: ${!showEmailAuth}`);
  };
  
  const handleGoogleSignInError = (error: Error) => {
    logError('Google sign-in error in dialog:', error);
    setAuthError('Failed to connect to Google. Please try again or use email sign-in.');
  };
  
  const handleDialogOpenChange = (newOpen: boolean) => {
    // If dialog is closing, reset state
    if (!newOpen) {
      setAuthError(null);
      
      // Small delay before resetting other state to avoid visual jumps
      setTimeout(() => {
        setShowEmailAuth(false);
        setActiveTab(defaultTab);
      }, 300);
    }
    
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'sign-in' ? 'Welcome back' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'sign-in' 
              ? 'Sign in to your Flight Finder account to continue'
              : 'Sign up for Flight Finder to access all features'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Display */}
          {authError && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}
          
          {/* Google Sign In Button - Primary Option */}
          <div className="pt-2">
            <GoogleSignInButton 
              onError={handleGoogleSignInError}
            />
          </div>
          
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <span className="relative bg-background px-2 text-sm text-muted-foreground">
              or
            </span>
          </div>
          
          {/* Toggle for Email/Password Auth */}
          <Button 
            variant="outline" 
            className="w-full flex justify-between items-center"
            onClick={toggleEmailAuth}
          >
            <span>Sign {activeTab === 'sign-in' ? 'in' : 'up'} with email</span>
            {showEmailAuth ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {/* Email/Password Auth - Initially Hidden */}
          {showEmailAuth && (
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => {
                setActiveTab(value as 'sign-in' | 'sign-up');
                debug(`Auth tab changed to: ${value}`);
              }} 
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="sign-in" className="mt-4">
                <SignInForm />
              </TabsContent>
              
              <TabsContent value="sign-up" className="mt-4">
                <SignUpForm />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}