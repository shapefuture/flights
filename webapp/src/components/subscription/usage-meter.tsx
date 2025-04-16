import React from 'react';
import { Progress } from '../ui/progress';
import { useAuth } from '../../context/auth-context';

interface UsageMeterProps {
  className?: string;
}

export function UsageMeter({ className }: UsageMeterProps) {
  const { subscription, remainingQueries } = useAuth();
  
  if (!subscription) {
    return null;
  }
  
  const { monthlyQuota, queriesUsed } = subscription;
  const percentage = (queriesUsed / monthlyQuota) * 100;
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Search Queries</span>
        <span className="text-sm text-muted-foreground">
          {remainingQueries} of {monthlyQuota} remaining
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}