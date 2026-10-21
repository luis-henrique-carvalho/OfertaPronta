import { Sparkles, Coins, FileCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { LegalCompanyProfile } from "@/lib/legal-company";

export interface TermsServiceCardsProps {
  profile: LegalCompanyProfile;
}

export function TermsServiceCards({ profile }: TermsServiceCardsProps) {
  return (
    <>
      {/* 1. Objeto do Serviço */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="text-xl">
            1. Objeto e Funcionamento do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            O <strong>{profile.tradeName}</strong> é uma plataforma online
            desenvolvida para microempresários gerarem Cards Publicitários
            profissionais para divulgação em redes sociais (Instagram e
            WhatsApp).
          </Typography>
          <Typography variant="p">
            A partir das informações inseridas pelo usuário (Briefing da
            Promoção) e do envio opcional de imagens de produtos ou referências
            visuais, nossos motores de Inteligência Artificial compõem peças
            publicitárias digitais completas.
          </Typography>
        </CardContent>
      </Card>

      {/* 2. Modelo de Pagamento Avulso */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Coins className="size-5" />
          </div>
          <CardTitle className="text-xl">
            2. Preço e Pagamento Avulso (Sem Assinatura)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            O OfertaPronta adota modelo de{" "}
            <strong>compra avulsa sob demanda</strong> no valor fixo de{" "}
            <strong>R$ 9,90 por campanha</strong>.
          </Typography>
          <Typography variant="p">
            <strong>Zero mensalidade ou assinatura:</strong> Não cobramos taxas
            recorrentes, não exigimos cadastro de cartão de crédito e não
            realizamos renovações automáticas. O pagamento é realizado
            exclusivamente via Pix (QR Code dinâmico e código Copia e Cola) com
            liquidação instantânea.
          </Typography>
        </CardContent>
      </Card>

      {/* 3. Entrega e Formatos */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCheck2 className="size-5" />
          </div>
          <CardTitle className="text-xl">
            3. Formatos Inclusos e Liberação Sem Marca d&apos;Água
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Cada campanha paga inclui a entrega do Card Publicitário gerado em{" "}
            <strong>2 formatos em alta resolução</strong>:
          </Typography>
          <div className="grid gap-2 pl-4">
            <Typography variant="muted" className="text-foreground">
              • <strong>Feed Instagram / WhatsApp:</strong> 1080 × 1350 px
              (proporção 4:5 vertical otimizada).
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>Story / Status:</strong> 1080 × 1920 px (proporção 9:16
              vertical completa).
            </Typography>
          </div>
          <Typography variant="p">
            Na prévia gratuita, a imagem exibe marca d&apos;água de segurança. A
            confirmação do Pix desbloqueia imediatamente o download dos arquivos
            originais limpos em alta definição.
          </Typography>
        </CardContent>
      </Card>

      {/* 4. Regenerações com IA */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="text-xl">
            4. Regenerações e Ajustes com IA Pós-Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Após a confirmação do pagamento, o cliente tem direito a{" "}
            <strong>até 3 (três) regenerações ou ajustes por IA</strong> para a
            mesma campanha, caso deseje testar variações de estilo, iluminação
            ou composição gráfica.
          </Typography>
          <Typography variant="p">
            Essa janela de ajuste pós-compra permanece ativa por 30 minutos a
            partir da confirmação do pagamento para assegurar integridade
            técnica e disponibilidade dos recursos.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
