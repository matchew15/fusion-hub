import { useUser } from "@/hooks/use-user";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import NotificationBell from "../notifications/NotificationBell";

export default function Header() {
  const { user, login, logout, isAuthenticating } = useUser();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Fusion Hub</span>
          </a>
        </div>

        <div className="flex flex-1 items-center space-x-2 justify-end">
          {user && <NotificationBell />}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {t('nav.welcome', { username: user.username })}
              </span>
              <Button
                variant="outline"
                onClick={() => logout()}
                className="neon-border"
              >
                {t('nav.logout')}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => login()}
              disabled={isAuthenticating}
              className="neon-border"
            >
              {isAuthenticating ? "Connecting..." : t('nav.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
