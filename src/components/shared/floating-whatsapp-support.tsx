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
      size="icon"
      aria-label="Atendimento via WhatsApp"
      className="fixed bottom-4 right-4 z-40 size-12 rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#20ba59] active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <a
        href={profile.supportWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
      >
        <MessageCircle className="size-6" />
        <span className="sr-only">Atendimento via WhatsApp</span>
      </a>
    </Button>
  );
}
