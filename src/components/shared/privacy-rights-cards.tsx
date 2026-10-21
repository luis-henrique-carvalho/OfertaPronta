import { Eye, Cookie, UserCheck, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { LegalCompanyProfile } from "@/lib/legal-company";

export interface PrivacyRightsCardsProps {
  profile: LegalCompanyProfile;
}

export function PrivacyRightsCards({ profile }: PrivacyRightsCardsProps) {
  return (
    <>
      {/* 4. Retenção de Dados por 7 Dias */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Eye className="size-5" />
          </div>
          <CardTitle className="text-xl">
            4. Ciclo de Vida e Retenção Segura (7 Dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Os cards gerados e os insumos de imagem fornecidos permanecem
            armazenados de maneira segura e criptografada pelo período de{" "}
            <strong>7 (sete) dias corridos</strong> a contar da confirmação do
            pedido.
          </Typography>
          <Typography variant="p">
            Esse prazo existe exclusivamente para garantir que você possa fazer
            o download dos arquivos e usufruir da janela de regenerações de IA
            pós-compra. Findo o prazo de 7 dias, os arquivos podem ser
            descartados automaticamente da infraestrutura ativa.
          </Typography>
        </CardContent>
      </Card>

      {/* 5. Cookies e Métricas de Anúncios */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie className="size-5" />
          </div>
          <CardTitle className="text-xl">
            5. Política de Cookies e Métricas de Anúncios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Utilizamos cookies e tecnologias semelhantes para garantir o
            funcionamento técnico da plataforma (como a memorização do rascunho
            de criação) e para mensurar a eficácia de nossas campanhas
            publicitárias nas redes (Meta Pixel e Google Ads).
          </Typography>
          <Typography variant="p">
            O usuário pode gerenciar suas preferências através de nosso Banner
            de Consentimento ou configurando diretamente as opções de
            privacidade de seu navegador de internet.
          </Typography>
        </CardContent>
      </Card>

      {/* 6. Direitos do Titular (LGPD) */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="size-5" />
          </div>
          <CardTitle className="text-xl">
            6. Seus Direitos como Titular de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Nos termos do Art. 18 da LGPD, você possui o direito de solicitar a
            qualquer momento:
          </Typography>
          <div className="grid gap-1 pl-4">
            <Typography variant="muted" className="text-foreground">
              • Confirmação da existência de tratamento e acesso aos seus dados;
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • Correção de dados incompletos, inexatos ou desatualizados;
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • Anonimização, bloqueio ou eliminação de dados desnecessários ou
              tratados em desacordo;
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • Revogação do consentimento para cookies e comunicações.
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* 7. Canal de Contato com Encarregado (DPO) */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <CardTitle className="text-xl">
            7. Canal de Contato do Encarregado (DPO)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Typography variant="p">
            Para exercer qualquer um de seus direitos ou esclarecer dúvidas
            sobre esta Política de Privacidade, entre em contato diretamente com
            nossa equipe de privacidade:
          </Typography>
          <div className="grid gap-1 pl-4">
            <Typography variant="muted" className="text-foreground">
              • <strong>Encarregado de Proteção de Dados:</strong> Privacidade{" "}
              {profile.tradeName}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>E-mail direto:</strong> {profile.contactEmail}
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>Razão Social:</strong> {profile.legalName} (CNPJ:{" "}
              {profile.cnpj})
            </Typography>
            <Typography variant="muted" className="text-foreground">
              • <strong>Atendimento WhatsApp:</strong> {profile.supportWhatsapp}
            </Typography>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
