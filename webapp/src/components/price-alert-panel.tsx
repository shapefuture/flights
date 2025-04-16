import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Trash2, RefreshCw, CheckCircle2, Mail, AlertTriangle } from 'lucide-react';
import { priceAlertService } from '../services/priceAlertService';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';

export function PriceAlertPanel() {
  const [alerts, setAlerts] = useState<ReturnType<typeof priceAlertService.getAlerts>>([]);
  const [email, setEmail] = useState('');
  const [isCheckingPrices, setIsCheckingPrices] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { toast } = useToast();
  
  // Load alerts on component mount
  useEffect(() => {
    refreshAlerts();
  }, []);
  
  const refreshAlerts = () => {
    const currentAlerts = priceAlertService.getAlerts();
    setAlerts(currentAlerts);
  };
  
  const handleDeleteAlert = (id: string) => {
    priceAlertService.deleteAlert(id);
    refreshAlerts();
    
    toast({
      title: "Alert Deleted",
      description: "Price alert has been removed",
    });
  };
  
  const handleToggleNotifications = (id: string, currentState: boolean) => {
    priceAlertService.updateAlert(id, { notificationsEnabled: !currentState });
    refreshAlerts();
    
    toast({
      title: currentState ? "Notifications Disabled" : "Notifications Enabled",
      description: `You will ${currentState ? 'no longer' : 'now'} receive notifications for this alert`
    });
  };
  
  const handleUpdateEmail = (id: string) => {
    if (!email) return;
    
    priceAlertService.updateAlert(id, { email });
    refreshAlerts();
    setEmail('');
    
    toast({
      title: "Email Updated",
      description: "Your email has been updated for this alert"
    });
  };
  
  const handleCheckPrices = async () => {
    setIsCheckingPrices(true);
    
    try {
      const results = await priceAlertService.checkAlerts();
      
      if (results.length > 0) {
        toast({
          title: "Price Drops Found!",
          description: `Found ${results.length} price drops on your alerts!`,
          variant: "default"
        });
        
        // Show more detailed info for each price drop
        results.forEach(result => {
          toast({
            title: `Price Drop: ${result.percentDrop.toFixed(1)}%`,
            description: `Price dropped from ${result.oldPrice} to ${result.newPrice}`,
            variant: "default"
          });
        });
      } else {
        toast({
          title: "No Price Drops",
          description: "No significant price drops were found at this time",
          variant: "default"
        });
      }
      
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to check prices, please try again later",
        variant: "destructive"
      });
    } finally {
      setIsCheckingPrices(false);
      refreshAlerts();
    }
  };
  
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return;
    }
    
    if (Notification.permission === 'granted') {
      toast({
        title: "Notifications Already Enabled",
        description: "You're all set to receive notifications",
      });
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive price drop notifications",
        });
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Price Alerts</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={requestNotificationPermission}
            className="flex items-center gap-1"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Enable Notifications</span>
          </Button>
        </CardTitle>
        <CardDescription>
          Get notified when prices drop below your threshold
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {showSuccessMessage && (
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Price check completed!
            </AlertDescription>
          </Alert>
        )}
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>You don't have any price alerts yet</p>
            <p className="text-sm">Save a flight search to create alerts</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {alerts.map(alert => (
                <div 
                  key={alert.id} 
                  className="p-4 border rounded-lg flex flex-col gap-2"
                >
                  <div className="flex justify-between">
                    <div className="font-medium">
                      {alert.query.origin} → {alert.query.dest}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleNotifications(alert.id, alert.notificationsEnabled)}
                        aria-label={alert.notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                      >
                        {alert.notificationsEnabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAlert(alert.id)}
                        aria-label="Delete alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Current price: ${alert.basePrice}</div>
                    <div>Alert threshold: {alert.threshold}% drop</div>
                    <div>Created: {formatDistanceToNow(alert.createdAt)} ago</div>
                  </div>
                  
                  {alert.notificationsEnabled && !alert.email && (
                    <div className="mt-2 flex flex-col gap-2">
                      <Label htmlFor={`email-${alert.id}`} className="text-xs">
                        Add email for notifications:
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`email-${alert.id}`}
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="h-8 text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateEmail(alert.id)}
                          disabled={!email}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleCheckPrices}
          disabled={isCheckingPrices || alerts.length === 0}
        >
          {isCheckingPrices ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking prices...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check prices now
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}