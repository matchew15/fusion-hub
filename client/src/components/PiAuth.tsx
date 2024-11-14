import { useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function PiAuth() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mutate } = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    try {
      setIsAuthenticating(true);
      
      // Simple Pi SDK check
      if (typeof window.Pi === 'undefined') {
        throw new Error('Please use Pi Browser');
      }

      // Basic Pi authentication
      const auth = await window.Pi.authenticate(['payments', 'username'], {
        onIncompletePaymentFound: (payment: any) => {
          console.log('Incomplete payment found:', payment);
          return Promise.resolve();
        }
      });

      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: auth.accessToken,
          uid: auth.user.uid
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const data = await response.json();
      mutate(data.user);
      navigate('/profile');

      toast({
        title: "Success",
        description: "Successfully connected with Pi"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || 'Please try again'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Button 
      onClick={handleAuth}
      disabled={isAuthenticating}
      className="neon-focus"
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect with Pi'
      )}
    </Button>
  );
}
