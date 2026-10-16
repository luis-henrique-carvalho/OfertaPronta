import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Home } from "lucide-react";

export function RootNotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <Typography variant="h1" className="mb-2 text-primary font-black">
        404
      </Typography>
      <Typography variant="h2" className="mb-2">
        Página não encontrada
      </Typography>
      <Typography variant="muted" className="mb-6 max-w-md">
        O link que você tentou acessar não existe ou foi movido.
      </Typography>
      <Button variant="default" asChild>
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Voltar ao início
        </Link>
      </Button>
    </div>
  );
}
