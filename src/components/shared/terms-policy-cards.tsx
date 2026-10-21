import { Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { LegalCompanyProfile } from "@/lib/legal-company";

export interface TermsPolicyCardsProps {
  profile: LegalCompanyProfile;
}

export function TermsPolicyCards({ profile }: TermsPolicyCardsProps) {
  return (
    <>
      {/* 5. Armazenamento e Retenção */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="size-5" />
          </div>
          <CardTitle className="text-xl">
            5. Prazo de Armazenamento e Retenção (7 Dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Os arquivos gerados e os links permanentes de download são mantidos
            em nossa infraestrutura segura de armazenamento pelo período de{" "}
            <strong>7 (sete) dias corridos</strong> a contar da confirmação do
            pagamento.
          </Typography>
          <Typography variant="p">
            Recomendamos que o usuário faça o download dos arquivos em seu
            dispositivo logo após a compra. Decorrido o prazo de 7 dias, os
            arquivos de alta resolução podem ser removidos permanentemente dos
            servidores para conformidade e segurança.
          </Typography>
        </CardContent>
      </Card>

      {/* 6. Responsabilidade e Direitos */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">
            6. Responsabilidade pelo Conteúdo da Oferta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            O usuário declara ser legítimo titular ou possuidor de autorização
            para divulgar os preços, marcas, logotipos e fotos inseridos no
            briefing. O {profile.tradeName} atua como ferramenta tecnológica de
            composição visual e não se responsabiliza pelas ofertas comerciais
            praticadas perante o consumidor final.
          </Typography>
        </CardContent>
      </Card>

      {/* 7. Suporte e Dados da Empresa */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="size-5" />
          </div>
          <CardTitle className="text-xl">
            7. Atendimento e Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Em caso de dúvidas sobre pedidos, pagamento ou necessidade de
            suporte técnico, entre em contato pelos canais oficiais:
          </Typography>
          <div className="grid gap-1 pl-4">
            <Typography variant="muted" className="text-foreground">
              • <strong>Razão Social:</strong> {profile.legalName}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>CNPJ:</strong> {profile.cnpj}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>E-mail de Contato:</strong> {profile.contactEmail}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>WhatsApp de Suporte:</strong> {profile.supportWhatsapp}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>Localização:</strong> {profile.addressCityState}
            </Typography>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
