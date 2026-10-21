import { ShieldCheck, Database, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { LegalCompanyProfile } from "@/lib/legal-company";

export interface PrivacyDataCardsProps {
  profile: LegalCompanyProfile;
}

export function PrivacyDataCards({ profile }: PrivacyDataCardsProps) {
  return (
    <>
      {/* 1. Compromisso e Princípios */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">
            1. Nosso Compromisso com a LGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            A <strong>{profile.legalName}</strong> (&quot;
            {profile.tradeName}&quot;), inscrita no CNPJ sob o nº
            <strong> {profile.cnpj}</strong>, atua como controladora e operadora
            de dados no estrito cumprimento da Lei nº 13.709/2018 (Lei Geral de
            Proteção de Dados Pessoais - LGPD).
          </Typography>
          <Typography variant="p">
            Adotamos o princípio do <em>Privacy by Design</em> e da minimização
            de dados: coletamos apenas as informações estritamente necessárias
            para a prestação do serviço solicitado.
          </Typography>
        </CardContent>
      </Card>

      {/* 2. Dados Coletados e Finalidade */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="size-5" />
          </div>
          <CardTitle className="text-xl">
            2. Dados Coletados e Finalidades do Tratamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Tratamos as seguintes informações para finalidades específicas:
          </Typography>
          <div className="grid gap-3 pl-4">
            <div>
              <Typography
                variant="muted"
                className="font-semibold text-foreground"
              >
                • Informações do Briefing Promocional:
              </Typography>
              <Typography variant="muted">
                Nome do produto/serviço, preço promocional, descrição e fotos
                enviadas. Utilizadas exclusivamente para processamento e geração
                gráfica do Card Publicitário pela IA.
              </Typography>
            </div>
            <div>
              <Typography
                variant="muted"
                className="font-semibold text-foreground"
              >
                • Telefone / WhatsApp:
              </Typography>
              <Typography variant="muted">
                Caso informado ou utilizado para contato, serve unicamente para
                envio dos links permanentes de download e suporte direto ao
                pedido.
              </Typography>
            </div>
            <div>
              <Typography
                variant="muted"
                className="font-semibold text-foreground"
              >
                • Dados de Transação Pix:
              </Typography>
              <Typography variant="muted">
                Identificador de transação (txId) e status do pagamento via
                nosso parceiro de liquidação (Pushin Pay), sem armazenamento de
                dados bancários sensíveis.
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Não Comercialização de Dados */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <CardTitle className="text-xl">
            3. Ausência de Venda ou Compartilhamento Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            <strong>Não vendemos, não alugamos e não compartilhamos</strong>{" "}
            seus dados pessoais, imagens ou informações de ofertas com terceiros
            para fins de marketing ou publicidade alheia.
          </Typography>
          <Typography variant="p">
            O compartilhamento de dados restringe-se estritamente aos provedores
            de infraestrutura essenciais à execução do serviço (ex:
            processamento de IA multimodal e gateway de pagamento Pix), sob
            rigorosos acordos de sigilo e conformidade.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
