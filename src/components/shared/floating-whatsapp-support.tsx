import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCompanyLegalProfile } from "@/lib/legal-company";

export interface FloatingWhatsappSupportProps {
  pathname?: string;
  isMobile?: boolean;
}

export function FloatingWhatsappSupport({
  pathname: propPathname,
  isMobile: propIsMobile,
}: FloatingWhatsappSupportProps = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const isMobileHook = useIsMobile();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (propPathname !== undefined) return propPathname;
    if (typeof window !== "undefined") return window.location.pathname;
    return "";
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (propPathname !== undefined) {
      setCurrentPath(propPathname);
      return;
    }

    if (typeof window === "undefined") return;

    const updatePathname = () => {
      setCurrentPath(window.location.pathname);
    };

    updatePathname();
    window.addEventListener("popstate", updatePathname);

    return () => {
      window.removeEventListener("popstate", updatePathname);
    };
  }, [propPathname]);

  if (!isMounted) {
    return null;
  }

  const isMobile = propIsMobile !== undefined ? propIsMobile : isMobileHook;
  const isCreationWizard =
    currentPath === "/criar" || currentPath.startsWith("/criar/");

  // Oculta no mobile durante o assistente de criação onde a barra de ação inferior já ocupa o espaço
  if (isMobile && isCreationWizard) {
    return null;
  }

  const profile = getCompanyLegalProfile();

  return (
    <Button
      asChild
      aria-label="Atendimento via WhatsApp"
      className="fixed bottom-4 right-4 z-40 h-11 px-3 sm:px-4 rounded-full border border-border/80 bg-card/95 text-foreground shadow-lg backdrop-blur-md transition-all duration-200 hover:bg-card hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <a
        href={profile.supportWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
        className="flex items-center gap-2"
      >
        <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
          <MessageCircle className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        </span>
        <span className="hidden sm:inline-block text-xs font-semibold tracking-tight text-foreground/90">
          Suporte WhatsApp
        </span>
        <span className="sr-only">Atendimento via WhatsApp</span>
      </a>
    </Button>
  );
}
