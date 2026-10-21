import { clientEnv } from "@/config/client-env";

export interface CompanyLegalProfile {
  legalName: string;
  tradeName: string;
  cnpj: string;
  contactEmail: string;
  supportWhatsapp: string;
  supportWhatsappUrl: string;
  addressCityState: string;
}

export type LegalCompanyProfile = CompanyLegalProfile;

export interface GetCompanyLegalProfileOverrides {
  legalName?: string;
  tradeName?: string;
  cnpj?: string;
  contactEmail?: string;
  supportWhatsapp?: string;
  supportWhatsappText?: string;
  addressCityState?: string;
}

const DEFAULT_SUPPORT_MESSAGE =
  "Olá! Preciso de ajuda com meu pedido no OfertaPronta.";

/**
 * Formata 14 dígitos numéricos para a máscara de CNPJ padrão XX.XXX.XXX/XXXX-XX.
 * Caso não contenha 14 dígitos, retorna a string aparada sem quebrar a renderização.
 */
export function formatCnpj(rawCnpj: string): string {
  const digits = rawCnpj.replace(/\D/g, "");
  if (digits.length !== 14) {
    return rawCnpj.trim();
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Constrói URL universal do WhatsApp (https://wa.me/<numero>?text=...)
 * sanitizando caracteres não numéricos e aplicando encoding seguro de URI na mensagem.
 */
export function buildWhatsappSupportUrl(phone: string, text?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (!text || text.trim() === "") {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text.trim())}`;
}

/**
 * Retorna o perfil cadastral oficial da empresa com fallbacks determinísticos
 * para contingência quando variáveis de ambiente opcionais não forem fornecidas.
 */
export function getCompanyLegalProfile(
  overrides?: GetCompanyLegalProfileOverrides,
): CompanyLegalProfile {
  const legalName =
    overrides?.legalName ||
    clientEnv.VITE_PUBLIC_LEGAL_NAME ||
    "OfertaPronta Tecnologia Ltda";

  const tradeName =
    overrides?.tradeName || clientEnv.VITE_PUBLIC_APP_NAME || "OfertaPronta";

  const rawCnpj =
    overrides?.cnpj || clientEnv.VITE_PUBLIC_LEGAL_CNPJ || "00.000.000/0001-00";

  const contactEmail =
    overrides?.contactEmail ||
    clientEnv.VITE_PUBLIC_CONTACT_EMAIL ||
    "contato@ofertapronta.com.br";

  const supportWhatsapp =
    overrides?.supportWhatsapp ||
    clientEnv.VITE_PUBLIC_SUPPORT_WHATSAPP ||
    "+55 11 99999-9999";

  const supportWhatsappMessage =
    overrides?.supportWhatsappText || DEFAULT_SUPPORT_MESSAGE;

  const supportWhatsappUrl = buildWhatsappSupportUrl(
    supportWhatsapp,
    supportWhatsappMessage,
  );

  const addressCityState = overrides?.addressCityState || "São Paulo - SP";

  return {
    legalName,
    tradeName,
    cnpj: formatCnpj(rawCnpj),
    contactEmail,
    supportWhatsapp,
    supportWhatsappUrl,
    addressCityState,
  };
}
