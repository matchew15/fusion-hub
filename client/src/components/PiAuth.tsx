import { useState } from "react";
import { useNavigate } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { piHelper } from "@/lib/pi-helper";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function PiAuth() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mutate } = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuth = async () => {
    if (!piHelper.isPiBrowser()) {
      toast({
        variant: "destructive",
        title: "Browser Error",
        description: "Please use Pi Browser to authenticate",
      });
      return;
    }

    try {
      setIsAuthenticating(true);
      await piHelper.init();
      const auth = await piHelper.authenticate();
      
      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const user = await response.json();
      mutate(user);
      navigate('/profile');
      
      toast({
        title: "Success",
        description: "Successfully authenticated with Pi Network"
      });
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message
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
        t('nav.login')
      )}
    </Button>
  );
}
