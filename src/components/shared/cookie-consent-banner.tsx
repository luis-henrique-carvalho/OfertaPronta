import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export const COOKIE_CONSENT_KEY = "ofertapronta_cookie_consent";
export const COOKIE_CONSENT_ACCEPTED = "accepted";

export function CookieConsentBanner() {
  const [isMounted, setIsMounted] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent === COOKIE_CONSENT_ACCEPTED) {
          setHasConsented(true);
        }
      }
    } catch {
      // Falha defensiva caso cookies/localStorage estejam bloqueados
    }
  }, []);

  const handleAccept = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          COOKIE_CONSENT_KEY,
          COOKIE_CONSENT_ACCEPTED,
        );
      }
    } catch {
      // Ignora falhas de escrita silenciosamente
    }
    setHasConsented(true);
  };

  if (!isMounted || hasConsented) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 inset-x-4 z-50 flex justify-center pointer-events-none"
      role="region"
      aria-label="Aviso de Cookies"
    >
      <Card className="pointer-events-auto flex w-full max-w-2xl flex-col items-start justify-between gap-4 p-4 shadow-xl sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-primary" />
          <Typography
            variant="muted"
            className="text-sm leading-relaxed text-foreground"
          >
            Usamos cookies para melhorar sua experiência e métricas de anúncios.
          </Typography>
        </div>
        <div className="flex w-full items-center justify-end sm:w-auto">
          <Button
            size="sm"
            onClick={handleAccept}
            className="w-full font-medium sm:w-auto"
          >
            Entendi
          </Button>
        </div>
      </Card>
    </div>
  );
}
