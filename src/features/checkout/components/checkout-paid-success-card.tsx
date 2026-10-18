import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export function CheckoutPaidSuccessCard() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <Card className="w-full border-primary/20 bg-card p-6 shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-10 text-emerald-500" />
          </div>

          <div className="flex flex-col gap-1">
            <Typography variant="h3" className="text-xl font-black">
              Pagamento Pix Confirmado!
            </Typography>
            <Typography variant="muted" className="text-xs">
              Seu card em alta definição sem marca d&apos;água está sendo
              liberado...
            </Typography>
          </div>

          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <ShieldCheck className="size-3.5 text-primary" />
            Redirecionando para seu pedido
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
