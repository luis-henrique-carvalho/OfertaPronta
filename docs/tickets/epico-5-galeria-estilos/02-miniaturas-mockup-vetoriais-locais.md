# 02: Miniaturas Vetoriais Locais dos Mockups e Componente de Thumbnail

**Spec:** [`docs/specs/epico-5-galeria-estilos.md`](../../specs/epico-5-galeria-estilos.md)

**What to build:**
Implementar o componente visual de miniaturas `StyleMockupThumbnail` (`src/features/promotions/components/style-mockup-thumbnail.tsx`) para renderizar amostras visuais expressivas e fiéis ao estilo do anúncio antes da escolha do microempresário. O componente utiliza exclusivamente SVGs leves, gradientes e classes utilitárias Tailwind CSS v4 locais no bundle, suportando as 6 variantes visuais de nicho comercial definidas no catálogo (`retail-burst`, `fresh-organic`, `dark-luxury`, `rustic-wood`, `clean-minimal`, `neon-urban`), em proporção 4:5. Elimina completamente qualquer dependência de imagens remotas, S3, requisições HTTP adicionais ou atrasos de carregamento em redes móveis instáveis.

**Blocked by:** 01: Catálogo Canônico de Estilos Curados e Injeção de Direção de Arte no Gemini

**Status:** `ready-for-agent`

## Acceptance Criteria (BDD)

- [ ] **Dado** uma especificação de mockup com variante `retail-burst` (Supermercados e Encartes), **quando** renderizado por `StyleMockupThumbnail`, **então** deve exibir fundo com gradiente amarelo/vermelho, selo de oferta em destaque e elementos gráficos de impacto comercial.
- [ ] **Dado** uma especificação com variante `dark-luxury` (Empórios Nobres e Salões Premium), **quando** renderizado, **então** deve exibir fundo escuro refinado com textura sutil e acentos dourados/rose gold.
- [ ] **Dado** uma especificação com variante `rustic-wood` (Pizzarias a lenha e Hamburguerias artesanais), **quando** renderizado, **então** deve exibir tons de madeira, textura aconchegante e simulação de iluminação âmbar de forno/chapa.
- [ ] **Dado** especificações com variantes `fresh-organic`, `clean-minimal` ou `neon-urban`, **quando** renderizadas, **então** devem refletir com precisão os respectivos elementos gráficos de nicho (tons verdes de horta, linhas editoriais finas ou brilhos de neon).
- [ ] **Dado** o componente `StyleMockupThumbnail`, **quando** inspecionado e auditado, **então** deve renderizar puramente via DOM e SVG em memória, com zero requisições externas de rede, garantindo performance instantânea mesmo offline.
- [ ] **Dado** a suíte de testes de interface, **quando** executada com `pnpm test`, **então** `style-mockup-thumbnail.test.tsx` deve validar a renderização correta das 6 variantes visuais e acessibilidade.
