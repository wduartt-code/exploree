# Itapema Vista

Protótipo interativo de Itapema, Santa Catarina, inspirado na navegação visual da referência IMTIAZ Dubai.

## Abrir

Site: https://itapema-vista-explorer.marketing-lazarotto.chatgpt.site

O endereço hospedado fica privado para o proprietário. O código está nesta pasta; os arquivos publicados estão em `dist/`.

Para executar localmente:

```sh
npm start
```

Abra http://127.0.0.1:4173. É necessário servir a pasta por HTTP; abrir `index.html` diretamente como arquivo não carrega os módulos.

## Como funciona (padrão da referência IMTIAZ)

Nas cenas inspecionadas, a referência usa imagens pré-renderizadas: cada nível é uma **imagem pré-renderizada em alta resolução** (5504×3072), com **camadas SVG/HTML** por cima (áreas dos bairros, pinos, rótulos), arrastar e zoom sobre a imagem, nuvens em PNG que atravessam a tela e uma segunda imagem para o modo noite. A navegação desce em níveis: Cidade → Bairro → Empreendimento.

Este projeto segue o mesmo padrão:

- `index.html` — Vista 3D: Itapema → Canto da Praia & Centro / Meia Praia → página do prédio.
  - Arrastar, pinça e rolagem para zoom; duplo clique aproxima; setas e +/− no teclado.
  - Áreas dos bairros e pílulas clicáveis; pinos de pontos turísticos com cartão e distâncias; medalhões dos prédios com haste até o terreno.
  - Modo noite (troca de render com luzes da cidade), nuvens à deriva, camadas, favoritos, compartilhar, tela cheia, trilha de navegação e Voltar.
  - Região do prédio: perspectiva arquitetônica com edifício clicável → LP própria em `produto.html?id=brisa` (ou vista, horizonte, atlantico). A maquete Three.js é opcional.
  - Endereços diretos: `#/`, `#/meia-praia`, `#/horizonte`. Links antigos (`#vista`) continuam funcionando.
- `mapa.html` — o mapa 2D/3D interativo anterior (MapLibre), mantido como ferramenta complementar.

### Gerar ou refazer os renders

```sh
npm run render              # todas as cenas, dia e noite
npm run render -- itapema   # só uma cena
```

O script abre `dist/render.html` no Google Chrome sem interface, monta relevo real + foto aérea + prédios em 3D com a câmera de cada cena (definida em `scenes` no `dist/data.js`), salva `dist/renders/<cena>-day|night(.sm).webp` e grava a posição de cada pino em `dist/renders/scenes.json`. Para ajustar enquadramento, mude `camera` (centro, zoom, inclinação, rumo) e rode de novo. Para inspecionar a cena manualmente: `render.html?scene=itapema&debug=1`.

### Trocar por renders fotorrealistas

Para chegar ao acabamento da referência, produza as imagens em ferramenta de CGI (Unreal Engine com Cesium/Google Photorealistic 3D Tiles, ou 3ds Max/Blender + Corona/V-Ray) usando as mesmas câmeras, exporte em 16:9 e substitua os arquivos `.webp` em `dist/renders/`. Se o enquadramento mudar, ajuste as coordenadas (0–1) dos pinos em `scenes.json`.

## Conteúdo de teste

Os nomes, terrenos, formas, alturas e pavimentos dos quatro prédios são fictícios. Não representam imóveis disponíveis, projetos aprovados ou empreendimentos de construtoras reais. Os pontos turísticos são reais. As coordenadas indicam referências aproximadas; nas praias, representam um ponto e não toda a extensão.

As distâncias são calculadas pela fórmula de Haversine com raio terrestre médio de 6.371.008,8 metros. São arredondadas para dezenas de metros ou décimos de quilômetro. Não incluem trajetos por ruas, tempos de viagem, relevo ou acesso por trilhas. O Google Maps é aberto apenas quando o visitante solicita uma rota.

## Organização

| Arquivo | Responsabilidade |
|---|---|
| `dist/index.html`, `dist/vista.js`, `dist/vista.css` | Vista 3D por renders: cenas, pinos, zoom, noite, página do prédio |
| `dist/render.html`, `dist/render.js` | Estúdio de renders (relevo, foto aérea, prédios, câmera de cada cena) |
| `dist/renders/` | Imagens das cenas e `scenes.json` com as posições dos pinos |
| `dist/clouds/` | Nuvens translúcidas |
| `tools/render-scenes.mjs` | Gera os renders pelo Chrome sem interface |
| `tools/make-clouds.py` | Gera as nuvens (Pillow) |
| `dist/data.js` | Prédios, atrações, bairros, câmeras das cenas e cálculo das distâncias |
| `dist/mapa.html`, `dist/app.js` | Mapa interativo anterior |
| `dist/viewer.js` | Maquetes procedurais em Three.js |
| `dist/graphics.js` | Ícones e desenhos vetoriais dos prédios |
| `dist/style.css` | Aparência, temas e layout responsivo |
| `dist/map-style.json` | Estilo cartográfico baseado no OpenFreeMap |
| `dist/vendor/` | MapLibre GL JS 5.6.2 e Three.js 0.160.1 |
| `tests/geography.test.mjs` | Verificação dos cálculos e dos dados |

## Fontes

- Prefeitura de Itapema: https://www.itapema.sc.gov.br/turismo/nossas-praias/ — praias, Canto da Praia e Parque das Capivaras. Página consultada em 31/10/2026.
- OpenStreetMap: https://www.openstreetmap.org/node/4310268362 — Mirante do Encanto; coordenadas verificadas pela API pública.
- UDESC: https://periodicos.udesc.br/index.php/percursos/article/download/17694/12209 — referência geográfica da Ponte dos Suspiros.
- Relevo: Mapzen Terrain Tiles (Terrarium) na AWS Open Data.
- Imagens aéreas: Esri, Vantor, Earthstar Geographics e GIS User Community, via World Imagery.
- Cartografia: OpenFreeMap e colaboradores do OpenStreetMap.
- Fontes tipográficas: DM Sans e Manrope, Google Fonts; há alternativas locais de sistema.

O mapa requer internet para carregar as imagens aéreas e os dados cartográficos. As bibliotecas de navegação e 3D estão incluídas no projeto. Não há login próprio, cobrança, captura de localização do visitante ou formulário que envie dados.

## Validação

```sh
npm test
```

Sete testes verificam a posição dos pinos dentro de cada render e distância de referência conhecida, antimeridiano, simetria, coordenadas, ordenação por proximidade e formatação brasileira. A experiência também é verificada no navegador em desktop e celular: seleção, distâncias, links de rota, maquete, filtros, temas e passeio.

## Refinamento visual — 1/11/2026

Fluxo: cidade → bairro → região do edifício → página do produto. Imagens decodificadas antecipadamente; câmera interpolada por requestAnimationFrame, sem cortina preta entre cenas e sem recuo automático na chegada. A troca de enquadramentos ainda usa dissolução entre imagens pré-renderizadas: não é voo sobre malha 3D contínua. Inclinação visual leve aplicada conjuntamente às imagens e marcadores.

Novas nuvens vistas de cima em `dist/clouds/aerial-cloud.webp`, produzidas com imagegen integrado. Prompt: `assets-prompt-cloud-v2.md`. Cenas artísticas em `dist/renders/premium/`; perspectivas arquitetônicas em `dist/renders/architecture/`. Prompts completos nos arquivos `assets-prompts-*.md`. Originais gerados em 1672×941, sem alegação de 4K nativo. Modelos Blender editáveis em `production/blender/`; acabamento das perspectivas assistido por IA. Não são fotografias documentais ou levantamento cadastral.

LPs incluem conceito, imagem, localização e sete distâncias em linha reta. Nenhum formulário ou contato fictício foi inserido.
