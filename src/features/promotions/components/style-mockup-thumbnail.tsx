// shadcn-ignore: Componente de renderização vetorial SVG local para amostras de mockups visuais
import { useId } from "react";
import { cn } from "@/lib/utils";

export type LayoutVariant =
  | "retail-burst"
  | "fresh-organic"
  | "dark-luxury"
  | "rustic-wood"
  | "clean-minimal"
  | "neon-urban";

export interface StyleMockupSpec {
  layoutVariant: LayoutVariant;
  badgeText: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

export interface StyleMockupThumbnailProps {
  mockup: StyleMockupSpec;
  className?: string;
  ariaLabel?: string;
}

/**
 * Componente visual de miniatura vetorial local para amostras gráficas de estilos.
 * Renderiza exclusivamente via SVG em memória e Tailwind CSS v4, garantindo 0 requisições
 * de rede, 0ms de latência de carregamento e fidelidade aos códigos visuais de cada nicho.
 */
export function StyleMockupThumbnail({
  mockup,
  className,
  ariaLabel,
}: StyleMockupThumbnailProps) {
  const uniqueId = useId();
  const safeId = uniqueId.replace(/:/g, "_");

  const effectiveAriaLabel =
    ariaLabel ||
    `Amostra visual do estilo ${mockup.layoutVariant}: ${mockup.badgeText}`;

  return (
    <div
      role="img"
      aria-label={effectiveAriaLabel}
      data-testid={`style-mockup-${mockup.layoutVariant}`}
      data-layout-variant={mockup.layoutVariant}
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border/40 select-none shadow-xs transition-transform duration-200",
        className,
      )}
    >
      <svg
        viewBox="0 0 200 250"
        className="size-full"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {renderVariantSvg(mockup, safeId)}
      </svg>
    </div>
  );
}

function renderVariantSvg(mockup: StyleMockupSpec, idPrefix: string) {
  switch (mockup.layoutVariant) {
    case "retail-burst":
      return renderRetailBurst(mockup, idPrefix);
    case "fresh-organic":
      return renderFreshOrganic(mockup, idPrefix);
    case "dark-luxury":
      return renderDarkLuxury(mockup, idPrefix);
    case "rustic-wood":
      return renderRusticWood(mockup, idPrefix);
    case "clean-minimal":
      return renderCleanMinimal(mockup, idPrefix);
    case "neon-urban":
      return renderNeonUrban(mockup, idPrefix);
    default:
      return renderRetailBurst(mockup, idPrefix);
  }
}

/**
 * 1. Retail Burst (Supermercados, encartes promocionais, varejo de grande impacto)
 */
function renderRetailBurst(mockup: StyleMockupSpec, id: string) {
  const gradId = `retail-grad-${id}`;
  const radialId = `retail-radial-${id}`;
  const bg = mockup.bgColor || "#EF4444";
  const accent = mockup.accentColor || "#FBBF24";

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bg} />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <radialGradient id={radialId} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.45" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fundo Gradiente e Glow Radial */}
      <rect width="200" height="250" fill={`url(#${gradId})`} />
      <rect width="200" height="250" fill={`url(#${radialId})`} />

      {/* Raios Solares / Sunburst de Urgência de Varejo */}
      <g opacity="0.12" fill="#FFFFFF">
        <polygon points="100,110 70,0 90,0" />
        <polygon points="100,110 110,0 130,0" />
        <polygon points="100,110 170,0 190,0" />
        <polygon points="100,110 200,30 200,50" />
        <polygon points="100,110 200,90 200,110" />
        <polygon points="100,110 200,150 200,170" />
        <polygon points="100,110 190,250 170,250" />
        <polygon points="100,110 130,250 110,250" />
        <polygon points="100,110 90,250 70,250" />
        <polygon points="100,110 0,220 0,200" />
        <polygon points="100,110 0,160 0,140" />
        <polygon points="100,110 0,100 0,80" />
        <polygon points="100,110 0,40 0,20" />
        <polygon points="100,110 20,0 40,0" />
      </g>

      {/* Estrelas Geométricas Cintilantes */}
      <g fill={accent}>
        {/* Estrela superior esquerda */}
        <polygon points="28,26 31,34 39,37 31,40 28,48 25,40 17,37 25,34" />
        {/* Estrela superior direita */}
        <polygon points="172,24 175,32 183,35 175,38 172,46 169,38 161,35 169,32" />
        {/* Estrela média lateral */}
        <polygon points="182,145 184,150 189,152 184,154 182,159 180,154 175,152 180,150" />
      </g>

      {/* Círculo Central de Apresentação de Produto */}
      <circle
        cx="100"
        cy="110"
        r="44"
        fill="#FFFFFF"
        fillOpacity="0.18"
        stroke={accent}
        strokeWidth="2"
        strokeDasharray="4 3"
      />

      {/* Selo Explosivo Superior (Badge Starburst) */}
      <g transform="translate(100, 38)">
        <polygon
          points="0,-16 6,-14 12,-16 16,-10 22,-8 22,-2 26,4 22,10 22,16 16,18 12,24 6,22 0,24 -6,22 -12,24 -16,18 -22,16 -22,10 -26,4 -22,-2 -22,-8 -16,-10 -12,-16 -6,-14"
          fill={accent}
          stroke="#FFFFFF"
          strokeWidth="1.5"
          transform="scale(2.2, 1.1)"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill="#991B1B"
          letterSpacing="0.8"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Silhueta Central de Produto de Varejo */}
      <g transform="translate(82, 92)" fill="#FFFFFF" fillOpacity="0.85">
        <rect x="6" y="10" width="24" height="24" rx="4" />
        <path
          d="M10,10 L14,2 L22,2 L26,10 Z"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <circle cx="18" cy="22" r="5" fill={accent} />
      </g>

      {/* Barra de Preço Promocional e Urgência na Base */}
      <g transform="translate(14, 182)">
        <rect
          x="0"
          y="0"
          width="172"
          height="48"
          rx="10"
          fill={accent}
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <rect x="4" y="4" width="164" height="14" rx="5" fill="#DC2626" />
        <text
          x="86"
          y="14"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fill="#FFFFFF"
          letterSpacing="1"
        >
          SUPER DESCONTO
        </text>
        <text
          x="86"
          y="38"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill="#991B1B"
        >
          R$ 9,99
        </text>
      </g>
    </>
  );
}

/**
 * 2. Fresh Organic (Hortifrúti, feiras naturais, alimentação saudável e sustentável)
 */
function renderFreshOrganic(mockup: StyleMockupSpec, id: string) {
  const gradId = `fresh-grad-${id}`;
  const leafGradId = `fresh-leaf-${id}`;
  const bg = mockup.bgColor || "#059669";
  const accent = mockup.accentColor || "#10B981";

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="60%" stopColor={bg} />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id={leafGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {/* Fundo Gradiente Verde Orgânico */}
      <rect width="200" height="250" fill={`url(#${gradId})`} />

      {/* Ondulações Orgânicas e Linhas Curvas de Frescor */}
      <path
        d="M-20,90 Q40,60 100,85 T220,70 L220,250 L-20,250 Z"
        fill="#FFFFFF"
        fillOpacity="0.07"
      />
      <path
        d="M-20,135 Q60,165 130,130 T220,145 L220,250 L-20,250 Z"
        fill="#064E3B"
        fillOpacity="0.3"
      />

      {/* Folhas Estilizadas Flutuantes */}
      <g fill={`url(#${leafGradId})`}>
        {/* Folha Superior Direita */}
        <path
          d="M175,25 C190,15 195,35 185,45 C175,55 160,45 175,25 Z"
          opacity="0.8"
        />
        {/* Folha Superior Esquerda */}
        <path
          d="M25,50 C12,42 16,24 30,28 C42,32 35,52 25,50 Z"
          opacity="0.65"
        />
        {/* Folha Média Central */}
        <path
          d="M100,85 C115,70 125,90 115,100 C105,110 88,102 100,85 Z"
          opacity="0.25"
        />
      </g>

      {/* Selo Arredondado Superior de Frescor */}
      <g transform="translate(100, 36)">
        <rect
          x="-65"
          y="-13"
          width="130"
          height="26"
          rx="13"
          fill="#ECFDF5"
          stroke="#059669"
          strokeWidth="1.5"
        />
        {/* Ícone de broto verde ao lado do texto */}
        <circle cx="-48" cy="0" r="3.5" fill="#10B981" />
        <text
          x="2"
          y="4"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#065F46"
          letterSpacing="0.8"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Moldura Circular Orgânica Central */}
      <circle
        cx="100"
        cy="115"
        r="42"
        fill="#FFFFFF"
        fillOpacity="0.12"
        stroke="#A7F3D0"
        strokeWidth="1.5"
      />
      <circle
        cx="100"
        cy="115"
        r="36"
        fill="none"
        stroke="#A7F3D0"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Ilustração de Fruta / Folha no Centro */}
      <g transform="translate(85, 100)" fill="#D1FAE5">
        <circle cx="15" cy="18" r="14" fillOpacity="0.9" />
        <path
          d="M15,4 Q18,0 23,2"
          stroke="#064E3B"
          strokeWidth="2"
          fill="none"
        />
        <path d="M16,4 C22,4 24,10 18,10 Z" fill="#34D399" />
      </g>

      {/* Tag de Procedência / Colheita do Dia na Base */}
      <g transform="translate(20, 192)">
        <rect
          x="0"
          y="0"
          width="160"
          height="40"
          rx="12"
          fill="#FFFFFF"
          fillOpacity="0.95"
          stroke="#A7F3D0"
          strokeWidth="1.5"
        />
        <text
          x="80"
          y="16"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="#047857"
          letterSpacing="1.2"
        >
          DA HORTA PARA A MESA
        </text>
        <text
          x="80"
          y="31"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fill="#064E3B"
          letterSpacing="0.5"
        >
          SELEÇÃO DO DIA
        </text>
      </g>
    </>
  );
}

/**
 * 3. Dark Luxury (Empórios nobres, salões premium, carnes nobres e alta gastronomia)
 */
function renderDarkLuxury(mockup: StyleMockupSpec, id: string) {
  const spotId = `luxury-spot-${id}`;
  const goldGradId = `luxury-gold-${id}`;
  const bg = mockup.bgColor || "#111827";
  const gold = mockup.accentColor || "#F59E0B";

  return (
    <>
      <defs>
        <radialGradient id={spotId} cx="50%" cy="15%" r="75%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.32" />
          <stop offset="60%" stopColor="#1E293B" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0B0F17" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Fundo Preto Carvão / Grafite Nobre */}
      <rect width="200" height="250" fill={bg} />
      <rect width="200" height="250" fill={`url(#${spotId})`} />

      {/* Moldura Dupla Geométrica com Acentos Dourados */}
      <rect
        x="12"
        y="12"
        width="176"
        height="226"
        fill="none"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <rect
        x="16"
        y="16"
        width="168"
        height="218"
        fill="none"
        stroke="#475569"
        strokeWidth="0.6"
        strokeOpacity="0.5"
      />

      {/* Detalhes de Cantoneiras Nobres */}
      <g stroke={`url(#${goldGradId})`} strokeWidth="1.5" fill="none">
        <path d="M12,24 L24,12" />
        <path d="M188,24 L176,12" />
        <path d="M12,226 L24,238" />
        <path d="M188,226 L176,238" />
      </g>

      {/* Losangos / Diamantes Decorativos */}
      <g fill={gold}>
        <polygon points="100,10 103,13 100,16 97,13" />
        <polygon points="100,234 103,237 100,240 97,237" />
        <polygon points="10,125 13,128 10,131 7,128" />
        <polygon points="190,125 193,128 190,131 187,128" />
      </g>

      {/* Selo Nobre Superior */}
      <g transform="translate(100, 42)">
        <rect
          x="-55"
          y="-12"
          width="110"
          height="24"
          rx="3"
          fill="#1E293B"
          stroke={`url(#${goldGradId})`}
          strokeWidth="1"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#FDE68A"
          letterSpacing="2"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Brasão / Emblema Central em Filigrana de Ouro */}
      <g transform="translate(100, 115)">
        <circle
          cx="0"
          cy="0"
          r="38"
          fill="#0F172A"
          fillOpacity="0.8"
          stroke={`url(#${goldGradId})`}
          strokeWidth="1.2"
        />
        <polygon
          points="0,-22 18,0 0,22 -18,0"
          fill="none"
          stroke={gold}
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        {/* Monograma de Coroa / Estrela de Luxo */}
        <path
          d="M-10,6 L-14,-8 L-6,-2 L0,-12 L6,-2 L14,-8 L10,6 Z"
          fill={`url(#${goldGradId})`}
        />
      </g>

      {/* Linhas de Assinatura e Tipografia na Base */}
      <g transform="translate(100, 192)">
        <line
          x1="-45"
          y1="0"
          x2="45"
          y2="0"
          stroke={`url(#${goldGradId})`}
          strokeWidth="1"
          strokeOpacity="0.8"
        />
        <text
          x="0"
          y="15"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="600"
          fill="#F8FAFC"
          letterSpacing="3"
        >
          PREMIUM RESERVE
        </text>
        <line
          x1="-25"
          y1="24"
          x2="25"
          y2="24"
          stroke={`url(#${goldGradId})`}
          strokeWidth="0.7"
          strokeOpacity="0.5"
        />
      </g>
    </>
  );
}

/**
 * 4. Rustic Wood (Forno a lenha, pizzarias artesanais, hamburguerias, barbearias retrô)
 */
function renderRusticWood(mockup: StyleMockupSpec, id: string) {
  const fireGradId = `wood-fire-${id}`;
  const bg = mockup.bgColor || "#451A03";
  const accent = mockup.accentColor || "#D97706";

  return (
    <>
      <defs>
        <linearGradient id={fireGradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#EA580C" stopOpacity="0.85" />
          <stop offset="45%" stopColor={accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fundo Amadeirado Escuro */}
      <rect width="200" height="250" fill={bg} />

      {/* Ripas e Tábuas Horizontais com Junções Sutis */}
      <g stroke="#1C0A00" strokeWidth="2.5" opacity="0.65">
        <line x1="0" y1="48" x2="200" y2="48" />
        <line x1="0" y1="98" x2="200" y2="98" />
        <line x1="0" y1="148" x2="200" y2="148" />
        <line x1="0" y1="198" x2="200" y2="198" />
      </g>

      {/* Textura de Veios da Madeira (Linhas finas) */}
      <g stroke="#78350F" strokeWidth="0.8" opacity="0.4">
        <path d="M0,24 Q60,20 120,26 T200,22" fill="none" />
        <path d="M0,74 Q80,78 150,72 T200,76" fill="none" />
        <path d="M0,124 Q40,120 110,126 T200,122" fill="none" />
        <path d="M0,174 Q90,178 160,172 T200,176" fill="none" />
      </g>

      {/* Iluminação Quente de Forno / Brasa na Base */}
      <rect
        x="0"
        y="110"
        width="200"
        height="140"
        fill={`url(#${fireGradId})`}
      />

      {/* Faíscas e Brasas Flutuantes */}
      <g fill="#FDE68A" opacity="0.75">
        <circle cx="45" cy="180" r="1.5" />
        <circle cx="85" cy="165" r="2" />
        <circle cx="155" cy="175" r="1.5" />
        <circle cx="120" cy="150" r="1" />
        <circle cx="168" cy="140" r="1.8" />
      </g>

      {/* Selo Rústico com Borda Tracejada / Efeito Carimbo */}
      <g transform="translate(100, 34)">
        <rect
          x="-62"
          y="-13"
          width="124"
          height="26"
          rx="5"
          fill="#271004"
          stroke={accent}
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#FEF3C7"
          letterSpacing="1.2"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Emblema Central: Chamas e Forno a Lenha */}
      <g transform="translate(100, 114)">
        <circle
          cx="0"
          cy="0"
          r="36"
          fill="#271004"
          stroke={accent}
          strokeWidth="2"
        />
        {/* Labaredas em Fogo Ilustrado */}
        <path
          d="M0,18 C12,18 16,8 10,-2 C6,-8 0,-18 0,-18 C0,-18 -6,-8 -10,-2 C-16,8 -12,18 0,18 Z"
          fill="#EA580C"
        />
        <path
          d="M0,18 C7,18 9,12 6,4 C4,0 0,-8 0,-8 C0,-8 -4,0 -6,4 C-9,12 -7,18 0,18 Z"
          fill="#FBBF24"
        />
      </g>

      {/* Placa Rústica de Madeira na Base */}
      <g transform="translate(25, 196)">
        <rect
          x="0"
          y="0"
          width="150"
          height="38"
          rx="6"
          fill="#78350F"
          stroke="#FCD34D"
          strokeWidth="1.5"
        />
        <circle cx="10" cy="19" r="2.5" fill="#291305" />
        <circle cx="140" cy="19" r="2.5" fill="#291305" />
        <text
          x="75"
          y="16"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fill="#FEF3C7"
          letterSpacing="1.2"
        >
          RECEITA ARTESANAL
        </text>
        <text
          x="75"
          y="29"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#FFFFFF"
        >
          FEITO NA LENHA
        </text>
      </g>
    </>
  );
}

/**
 * 5. Clean Minimal (Spa & estética, design moderno, óticas, bistrô editorial refinado)
 */
function renderCleanMinimal(mockup: StyleMockupSpec, id: string) {
  const circleGradId = `clean-circle-${id}`;
  const bg = mockup.bgColor || "#F8FAFC";
  const text = mockup.textColor || "#0F172A";
  const accent = mockup.accentColor || "#64748B";

  return (
    <>
      <defs>
        <radialGradient id={circleGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={bg} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Fundo Arejado e Minimalista */}
      <rect width="200" height="250" fill={bg} />

      {/* Moldura Interna de Linhas Finas Elegantes */}
      <rect
        x="15"
        y="15"
        width="170"
        height="220"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1"
      />

      {/* Forma Abstrata Pastel / Círculo Central Suave */}
      <circle cx="100" cy="112" r="54" fill={`url(#${circleGradId})`} />

      {/* Linhas Arquiteturais Delicadas */}
      <line
        x1="30"
        y1="75"
        x2="170"
        y2="75"
        stroke="#E2E8F0"
        strokeWidth="0.8"
      />
      <line x1="100" y1="60" x2="100" y2="90" stroke={accent} strokeWidth="1" />

      {/* Selo Minimalista Superior com Sombra Discreta */}
      <g transform="translate(100, 38)">
        <rect
          x="-50"
          y="-11"
          width="100"
          height="22"
          rx="11"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          fill={text}
          letterSpacing="1.5"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Elemento de Design Editorial Central (Arco Fino) */}
      <g transform="translate(100, 115)">
        <path
          d="M-28,24 C-28,-14 28,-14 28,24"
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
        />
        <circle cx="0" cy="4" r="3" fill={accent} />
        <line
          x1="-35"
          y1="24"
          x2="35"
          y2="24"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
      </g>

      {/* Bloco Tipográfico Editorial na Base */}
      <g transform="translate(100, 188)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontSize="11"
          fontWeight="300"
          fill={text}
          letterSpacing="4"
        >
          EDITORIAL
        </text>
        <line x1="-20" y1="8" x2="20" y2="8" stroke={accent} strokeWidth="1" />
        <text
          x="0"
          y="22"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="500"
          fill="#64748B"
          letterSpacing="2"
        >
          CONCEITO & EQUILÍBRIO
        </text>
      </g>
    </>
  );
}

/**
 * 6. Neon Urban (Fade moderno, barbearias urbanas, delivery noturno, estética cyber/street)
 */
function renderNeonUrban(mockup: StyleMockupSpec, id: string) {
  const neonGlowId = `neon-glow-${id}`;
  const neonGradId = `neon-grad-${id}`;
  const bg = mockup.bgColor || "#090D16";
  const neon = mockup.accentColor || "#8B5CF6";

  return (
    <>
      <defs>
        {/* Filtro de Brilho Neon Difuso */}
        <filter id={neonGlowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur1" />
          <feGaussianBlur stdDeviation="5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={neonGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor={neon} />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* Fundo Escuro Meia-Noite */}
      <rect width="200" height="250" fill={bg} />

      {/* Linhas Angulares Diagonais Estilo Grid Urbano */}
      <g stroke="#1E293B" strokeWidth="1" opacity="0.6">
        <line x1="-20" y1="50" x2="220" y2="10" />
        <line x1="-20" y1="100" x2="220" y2="60" />
        <line x1="-20" y1="150" x2="220" y2="110" />
        <line x1="-20" y1="200" x2="220" y2="160" />
      </g>

      {/* Moldura Neon com Cantos Chanfrados */}
      <rect
        x="14"
        y="14"
        width="172"
        height="222"
        rx="8"
        fill="none"
        stroke={neon}
        strokeWidth="1.5"
        filter={`url(#${neonGlowId})`}
      />

      {/* Selo Neon Vibrante Superior */}
      <g transform="translate(100, 36)">
        <rect
          x="-58"
          y="-13"
          width="116"
          height="26"
          rx="6"
          fill="#0F172A"
          stroke={neon}
          strokeWidth="1.8"
          filter={`url(#${neonGlowId})`}
        />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="1.5"
        >
          {mockup.badgeText.toUpperCase()}
        </text>
      </g>

      {/* Ícone Central Neon Geométrico (Hexágono + Raio) */}
      <g transform="translate(100, 114)">
        <polygon
          points="0,-36 31,-18 31,18 0,36 -31,18 -31,-18"
          fill="#0B0F17"
          stroke={`url(#${neonGradId})`}
          strokeWidth="2"
          filter={`url(#${neonGlowId})`}
        />
        {/* Raio Elétrico Neon */}
        <polygon
          points="2,-18 -12,2 0,2 -2,18 12,-2 0,-2"
          fill="#06B6D4"
          filter={`url(#${neonGlowId})`}
        />
      </g>

      {/* Barra de Impacto Noturno / Urban Street na Base */}
      <g transform="translate(22, 190)">
        <rect
          x="0"
          y="0"
          width="156"
          height="38"
          rx="4"
          fill="#0F172A"
          fillOpacity="0.9"
          stroke={neon}
          strokeWidth="1.2"
        />
        <text
          x="78"
          y="15"
          textAnchor="middle"
          fontSize="7"
          fontWeight="800"
          fill="#06B6D4"
          letterSpacing="2"
        >
          URBAN EDITION
        </text>
        <text
          x="78"
          y="30"
          textAnchor="middle"
          fontSize="11"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="1"
        >
          NIGHT MOOD
        </text>
      </g>
    </>
  );
}
