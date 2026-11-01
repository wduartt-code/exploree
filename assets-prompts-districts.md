# District aerial asset prompts and provenance

Created 2026-10-31 with the built-in image_gen tool in edit mode. Original deterministic district rasters were inspected with view_image before editing. Day outputs supplied as edit target for the night variant. Original source assets unchanged.

These are illustrative architectural visualizations derived from the mapped reference framing, not surveyed photographs or authoritative records of individual existing buildings. Coastline, main roads, rivers and demo tower positions were visually retained. Raster editing can introduce small local spatial variations; hotspot alignment needs integration QA. Native outputs are 1672×941 pixels (approximately 16:9), despite requesting 3840×2160. No upscaling applied. No clouds baked in; designed for separate animated cloud overlays.

## canto-centro-day

Workspace: `dist/renders/premium/canto-centro-day.png`

Generated images are saved to /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8 as /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8/exec-8f83edc9-b8a8-4474-af7f-8c447483d4d0.png by default.

Prompt:

```text
Use case: style-transfer.
Asset type: full-screen high-resolution interactive district aerial for an Itapema real estate explorer.
Edit target: supplied Canto/Centro aerial image. Transform this visibly flat, low-detail GIS render into an exquisite photorealistic aerial architectural visualization of coastal southern Brazil. Keep its exact 16:9 framing, fixed camera, coastline, beach curve, hill shapes, headlands, rivers, motorway and street layout. Preserve the exact principal locations and silhouettes of the two pale demo towers: one around x37%,y51%, the other x58%,y74%. Build convincing volumetric detailed urban fabric on the existing footprints with varied white/beige contemporary apartment facades, glass windows, balconies, rooftops, natural palms and Brazilian low-rise houses. Keep existing density, rather than adding an invented skyline. Replace blurry ground texture with crisp believable buildings and roads. Transform hills into detailed lush Atlantic forest canopy, natural teal ocean into realistic nuanced water with fine gentle surf along the same beach, remove texture seams. Render premium architectural materials and contact shadows in warm clear late-afternoon sunlight, bright natural inviting colors, clean atmospheric perspective. Sharp detailed ground, tasteful sunlight, luxury real estate brochure quality. No text, labels, markers, borders, UI, logos, watermark, aircraft, clouds or sky band. Do not crop, move landmarks, change the coastline or camera. Final landscape 3840x2160 if possible.
```

## canto-centro-night

Workspace: `dist/renders/premium/canto-centro-night.png`

Generated images are saved to /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8 as /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8/exec-27a7bb5d-3692-484f-a744-1f1efb07a13e.png by default.

Prompt:

```text
Use case: lighting-weather.
Asset type: interactive aerial district blue-hour counterpart.
Edit the supplied photorealistic Canto/Centro aerial into blue hour just after sunset. Change ONLY lighting, illumination, sky reflection and time of day. Keep the camera, framing, coast, beach, hills, roads, buildings, trees and the two tall pale demo towers exactly aligned pixel-for-pixel. Deep rich blue and teal ocean with visible delicate surf, soft blue ambient light across lush forests, warm amber individual apartment windows, street lights tracing existing roads, elegant lit beachfront promenade and subtle lit facades. Realistic premium architectural night visualization, luminous yet natural, legible buildings and coastline, no excessive bloom, never black. No new objects, clouds, labels, text, UI, markers or logos. Full original image framing and aspect ratio.
```

## meia-praia-day

Workspace: `dist/renders/premium/meia-praia-day.png`

Generated images are saved to /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8 as /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8/exec-3e7f2916-a0e1-4b92-aebf-5d7779e9338b.png by default.

Prompt:

```text
Use case: style-transfer.
Asset type: full-screen high-resolution interactive district aerial for an Itapema real estate explorer.
Edit target: supplied Meia Praia aerial image. Transform this visibly flat, low-detail GIS render into an exquisite photorealistic aerial architectural visualization of coastal southern Brazil. Keep its exact 16:9 framing, fixed camera, coastline and beach line, distant hill and headland shapes, intricate rivers/wetlands in lower right, motorway and street grid. Preserve the exact principal locations and silhouettes of the two pale demo towers: one around x26%,y53%, the other x65%,y47%. Build convincing volumetric detailed urban fabric on the existing footprints with varied white/beige contemporary apartment facades, glass windows, balconies, rooftops, natural palms and Brazilian low-rise houses. Keep existing urban density and street structure, rather than adding an invented skyline. Replace blurry ground texture with crisp believable detailed buildings and roads. Transform hills and wetlands into detailed lush Atlantic forest canopy, natural teal ocean into realistic nuanced water with fine gentle surf along the same beach, remove texture seams. Render premium architectural materials and contact shadows in warm clear late-afternoon sunlight, bright natural inviting colors, clean atmospheric perspective. Sharp detailed ground, luxury real estate brochure quality. No text, labels, markers, borders, UI, logos, watermark, aircraft, clouds or sky band. Do not crop, move landmarks, change the coastline or camera. Final landscape 3840x2160 if possible.
```

## meia-praia-night

Workspace: `dist/renders/premium/meia-praia-night.png`

Generated images are saved to /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8 as /Users/adm/.codex/generated_images/01a1945f-8a28-71f0-b249-d5d7f50884e8/exec-ada01f35-ba13-4b28-9944-81167f6f8d7e.png by default.

Prompt:

```text
Use case: lighting-weather.
Asset type: interactive aerial district blue-hour counterpart.
Edit the supplied photorealistic Meia Praia aerial into blue hour just after sunset. Change ONLY lighting, illumination, water reflection and time of day. Keep the camera, framing, coast, beach, hills, roads, intricate wetland rivers and vegetation, buildings, trees and the two tall pale demo towers exactly aligned pixel-for-pixel. Deep rich blue and teal ocean with visible delicate surf, soft blue ambient light across lush forests, warm amber individual apartment windows, street lights tracing existing roads, elegant lit beachfront promenade and subtle lit facades. Realistic premium architectural night visualization, luminous yet natural, legible buildings and coastline, no excessive bloom, never black. No new objects, clouds, labels, text, UI, markers or logos. Full original image framing and aspect ratio.
```

