import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';
import { GoogleSignInButton } from './google-sign-in-button';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  
  const toggleEmailAuth = () => {
    setShowEmailAuth(!showEmailAuth);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {/* Google Sign In Button - Primary Option */}
          <div className="pt-2">
            <GoogleSignInButton />
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sign-in' | 'sign-up')} className="mt-4">
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