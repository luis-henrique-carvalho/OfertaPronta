import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { AlertTriangle, Home } from "lucide-react";

export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <Typography variant="h2" className="mb-2">
        Algo deu errado
      </Typography>
      <Typography variant="muted" className="mb-6 max-w-md">
        {error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado ao carregar a página."}
      </Typography>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="default" onClick={() => reset()}>
          Tentar novamente
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Página inicial
          </Link>
        </Button>
      </div>
    </div>
  );
}
