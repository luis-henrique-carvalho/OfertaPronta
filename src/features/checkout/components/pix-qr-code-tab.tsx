import { Typography } from "@/components/ui/typography";

export interface PixQrCodeTabProps {
  formattedQrCodeSrc: string | null;
  formattedPrice: string;
}

export function PixQrCodeTab({
  formattedQrCodeSrc,
  formattedPrice,
}: PixQrCodeTabProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {formattedQrCodeSrc ? (
        // shadcn-ignore: layout do container do qr code
        <div className="mx-auto flex flex-col items-center rounded-2xl border border-border bg-white p-4 shadow-sm">
          {/* shadcn-ignore: QR code image tag */}
          <img
            src={formattedQrCodeSrc}
            alt={`QR Code Pix Dinâmico para Pagamento de ${formattedPrice}`}
            className="size-48 max-w-full object-contain"
          />
        </div>
      ) : (
        // shadcn-ignore: layout do container do qr code
        <div className="flex size-48 items-center justify-center rounded-2xl border border-border bg-muted/50 p-4 text-center">
          <Typography variant="muted" className="text-xs">
            QR Code indisponível
          </Typography>
        </div>
      )}

      <Typography
        variant="muted"
        className="text-center text-xs text-muted-foreground"
      >
        Abra o app do seu banco, escolha <strong>Pagar com QR Code</strong> e
        aponte a câmera.
      </Typography>
    </div>
  );
}
