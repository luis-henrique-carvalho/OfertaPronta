import sharp from "sharp";
import { createServerLogger } from "../logger";

const log = createServerLogger("export-engine.image-processor");

export interface WatermarkOptions {
  watermarkText?: string;
  subText?: string;
}

export interface WatermarkResult {
  watermarkedBuffer: Buffer;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Garante dimensões exatas de 1080x1350 (proporção 4:5 Feed).
 * Se a imagem já estiver na proporção 4:5, redimensiona diretamente sem cortes.
 * Se vier em proporção vertical mais estreita (ex: 9:16 Story), preserva a arte no centro
 * com fundo desfocado harmônico nas laterais para nunca cortar elementos visuais.
 */
export async function formatFeedCard(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1350;
  const inputRatio = width / height;
  const feedRatio = 1080 / 1350; // 0.8

  log.info("Formatando imagem para Feed (1080x1350)", {
    width,
    height,
    inputRatio: Number(inputRatio.toFixed(3)),
  });

  // Se a imagem já estiver na proporção 4:5 (ou próxima com margem de 2%), redimensiona nativamente
  if (Math.abs(inputRatio - feedRatio) < 0.02) {
    return sharp(imageBuffer)
      .resize(1080, 1350, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer();
  }

  // Se a imagem for mais vertical que 4:5 (ex: 9:16 Story), aplica composição com fundo desfocado nas laterais
  if (inputRatio < feedRatio - 0.05) {
    const feedWidth = 1080;
    const feedHeight = 1350;

    const blurredBackground = await sharp(imageBuffer)
      .resize(feedWidth, feedHeight, {
        fit: "cover",
        position: "center",
      })
      .blur(30)
      .modulate({ brightness: 0.8 })
      .toBuffer();

    const scaledHeight = feedHeight;
    const scaledWidth = Math.round(feedHeight * inputRatio);
    const scaledForeground = await sharp(imageBuffer)
      .resize(scaledWidth, scaledHeight, {
        fit: "contain",
      })
      .png()
      .toBuffer();

    const leftOffset = Math.round((feedWidth - scaledWidth) / 2);

    return sharp(blurredBackground)
      .composite([
        {
          input: scaledForeground,
          top: 0,
          left: leftOffset,
        },
      ])
      .png()
      .toBuffer();
  }

  return sharp(imageBuffer)
    .resize(1080, 1350, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toBuffer();
}

/**
 * Deriva um card em dimensões exatas de 1080x1920 (proporção 9:16 Story).
 * Se a imagem de entrada já estiver no aspect ratio 9:16 nativo, redimensiona diretamente
 * sem cortes e sem necessidade de barras extras.
 * Se vier em 4:5 (Feed) ou formato mais largo, mantém a arte centralizada em 1080x1350
 * preenchendo as margens superior e inferior com fundo harmônico e desfocado da própria arte.
 */
export async function formatStoryCard(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1920;
  const inputRatio = width / height;
  const storyRatio = 1080 / 1920; // 0.5625

  log.info("Formatando imagem para Story (1080x1920)", {
    width,
    height,
    inputRatio: Number(inputRatio.toFixed(3)),
  });

  // Se a imagem de entrada já estiver no aspect ratio 9:16 Story (ou margem de 2%), redimensiona nativamente
  if (Math.abs(inputRatio - storyRatio) < 0.02) {
    return sharp(imageBuffer)
      .resize(1080, 1920, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer();
  }

  const storyWidth = 1080;
  const storyHeight = 1920;
  const feedHeight = 1350;

  // 1. Gera o plano de fundo harmônico estendido e desfocado
  const blurredBackground = await sharp(imageBuffer)
    .resize(storyWidth, storyHeight, {
      fit: "cover",
      position: "center",
    })
    .blur(30)
    .modulate({ brightness: 0.8 })
    .toBuffer();

  // 2. Garante a arte central exatamente em 1080x1350
  const centeredFeed = await formatFeedCard(imageBuffer);

  const topOffset = Math.round((storyHeight - feedHeight) / 2);

  // 3. Compõe a arte nítida no centro do fundo desfocado
  return sharp(blurredBackground)
    .composite([
      {
        input: centeredFeed,
        top: topOffset,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Aplica de forma indelével uma marca d'água diagonal semitransparente
 * cobrindo a arte para prévias gratuitas antes do pagamento Pix.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  options?: WatermarkOptions,
): Promise<WatermarkResult> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1350;

  log.info("Aplicando marca d'água de proteção na prévia", {
    width,
    height,
    bufferSizeBytes: imageBuffer.length,
  });

  const mainText = options?.watermarkText ?? "PRÉVIA OFERTAPRONTA";
  const subText = options?.subText ?? "ARTE PROTEGIDA • LIBERAÇÃO PÓS-PIX";

  // Gera composição SVG com padrão diagonal repetido para cobrir o card de ponta a ponta
  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm-pattern" width="460" height="340" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
          <text
            x="230"
            y="130"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="28"
            font-weight="900"
            letter-spacing="3"
            fill="rgba(255, 255, 255, 0.40)"
            stroke="rgba(0, 0, 0, 0.35)"
            stroke-width="1.2"
          >${escapeXml(mainText)}</text>
          <text
            x="230"
            y="170"
            text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif"
            font-size="14"
            font-weight="700"
            letter-spacing="2"
            fill="rgba(255, 255, 255, 0.35)"
            stroke="rgba(0, 0, 0, 0.30)"
            stroke-width="0.8"
          >${escapeXml(subText)}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm-pattern)" />
    </svg>
  `);

  const watermarkedBuffer = await sharp(imageBuffer)
    .composite([
      {
        input: svgOverlay,
        blend: "over",
      },
    ])
    .webp({ quality: 85 })
    .toBuffer();

  const dataUrl = `data:image/webp;base64,${watermarkedBuffer.toString("base64")}`;

  return {
    watermarkedBuffer,
    dataUrl,
    width,
    height,
  };
}

export interface CobrandingOptions {
  creditText?: string;
  aspectRatio?: "feed" | "story";
}

/**
 * Renderiza uma assinatura vetorial elegante em container translúcido de alto contraste
 * no rodapé do card nos formatos Feed (1080x1350) e Story (1080x1920).
 */
export async function applyCobrandingSignature(
  imageBuffer: Buffer,
  options?: CobrandingOptions,
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width ?? 1080;
  const height = metadata.height ?? 1350;
  const isStory = options?.aspectRatio === "story" || height > 1600;

  const creditText =
    (options?.creditText ?? "").trim() || "Design por @ofertapronta";
  const escapedText = escapeXml(creditText);

  // Calibração de dimensões e posições
  // Feed (1080×1350): Y centralizado em 1315px (margem inferior de 35px)
  // Story (1080×1920): Y centralizado em 1835px (acima da barra de resposta do Instagram)
  const posY = isStory ? 1835 : 1315;
  const fontSize = isStory ? 24 : 22;
  const pillPaddingX = 20;
  const pillHeight = 36;
  const pillRadius = 18;

  // Largura estimada do container pill com base na contagem de caracteres
  const charWidth = fontSize * 0.58;
  const estimatedTextWidth = Math.ceil(creditText.length * charWidth);
  const pillWidth = estimatedTextWidth + pillPaddingX * 2;
  const pillX = Math.round((width - pillWidth) / 2);
  const pillY = posY - Math.round(pillHeight / 2);
  const textBaselineY = posY + Math.round(fontSize * 0.35);

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- Pill translúcido de alto contraste que garante legibilidade sobre qualquer fundo -->
      <rect
        x="${pillX}"
        y="${pillY}"
        width="${pillWidth}"
        height="${pillHeight}"
        rx="${pillRadius}"
        ry="${pillRadius}"
        fill="rgba(0, 0, 0, 0.55)"
        stroke="rgba(255, 255, 255, 0.22)"
        stroke-width="1"
        filter="url(#shadow)"
      />
      <!-- Texto vetorial nítido -->
      <text
        x="${Math.round(width / 2)}"
        y="${textBaselineY}"
        text-anchor="middle"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        letter-spacing="0.4"
        fill="#FFFFFF"
      >${escapedText}</text>
    </svg>
  `);

  return sharp(imageBuffer)
    .composite([
      {
        input: svgOverlay,
        blend: "over",
      },
    ])
    .png()
    .toBuffer();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
