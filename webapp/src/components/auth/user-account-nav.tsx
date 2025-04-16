import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../context/auth-context';
import { LogOut, User, Settings, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { info, error as logError, debug } from '../../utils/logger';

export function UserAccountNav() {
  const { user, signOut, subscription } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  if (!user) return null;
  
  // Get user initials for avatar fallback
  const getInitials = () => {
    try {
      const name = user.user_metadata?.full_name || user.email || '';
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    } catch (err) {
      logError('Error generating user initials:', err);
      return 'U'; // Fallback
    }
  };
  
  // Get display name
  const getDisplayName = () => {
    try {
      return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    } catch (err) {
      logError('Error getting display name:', err);
      return 'User'; // Fallback
    }
  };
  
  // Get subscription tier display
  const getSubscriptionTier = () => {
    try {
      if (!subscription) return 'Free';
      return subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1);
    } catch (err) {
      logError('Error getting subscription tier:', err);
      return 'Free'; // Fallback
    }
  };
  
  // Handle sign out with error handling
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      debug('User initiated sign out');
      
      await signOut();
      
      info('User signed out successfully');
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (err) {
      logError('Error during sign out:', err);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={getDisplayName()} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>{getSubscriptionTier()} Plan</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isSigningOut}
          className="text-red-500 focus:text-red-500"
        >
          {isSigningOut ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}