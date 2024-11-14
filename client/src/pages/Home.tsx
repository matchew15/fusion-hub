import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import TransactionHistory from "@/components/TransactionHistory";
import React from "react";

export default function Home() {
  const { user } = useUser();
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold glow-text bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500">
          {t('home.title')}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t('home.subtitle')}
        </p>
      </section>

      {user ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="cyber-panel p-6 space-y-4">
              <h3 className="text-2xl font-bold text-primary">{t('home.features.trade.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.trade.description')}
              </p>
              <Link href="/marketplace">
                <Button className="w-full neon-border">{t('home.features.trade.action')}</Button>
              </Link>
            </Card>

            <Card className="cyber-panel p-6 space-y-4">
              <h3 className="text-2xl font-bold text-primary">{t('home.features.chat.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.chat.description')}
              </p>
              <Link href="/chat">
                <Button className="w-full neon-border">{t('home.features.chat.action')}</Button>
              </Link>
            </Card>

            <Card className="cyber-panel p-6 space-y-4">
              <h3 className="text-2xl font-bold text-primary">{t('home.features.wallet.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.wallet.description')}
              </p>
              <Link href="/wallet">
                <Button className="w-full neon-border">{t('home.features.wallet.action')}</Button>
              </Link>
            </Card>
          </div>

          <div>
            <TransactionHistory />
          </div>
        </div>
      ) : (
        <Card className="cyber-panel p-8 mt-8 text-center">
          <h2 className="text-3xl font-bold mb-4 glow-text">{t('home.getStarted.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('home.getStarted.description')}
          </p>
          <Button size="lg" className="neon-border">
            {t('home.getStarted.action')}
          </Button>
        </Card>
      )}
    </div>
  );
}
