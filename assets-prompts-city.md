# Itapema premium aerial assets

Generated 2026-10-31 using the built-in image_gen tool (not CLI/API fallback).

## Deliverables

- `dist/renders/premium/itapema-day.png`
- `dist/renders/premium/itapema-night.png`

Original day edit target: `dist/renders/itapema-day.webp`. Existing source renders were not overwritten. Both generated deliverables are 1672 × 941 pixels natively; the prompt requested 3840 × 2160 but the built-in tool returned the smaller size. No upscaling was applied or represented as native detail.

## Provenance and limits

The supplied terrain render was edited to provide volumetric illustrative architecture, vegetation and ocean surface for a concept website. These are AI-assisted illustrative enhancements, not surveyed architecture or documentary photography. Camera framing, major coast, terrain, roads and river layout were requested unchanged. Visual inspection shows the major land/water boundaries remain close to the original and day/night views align closely, but pixel-exact or geospatial accuracy is not guaranteed; beach widths, building massing and local details are illustrative. The generated skyline is not a verified model of the existing buildings. Any distance values must still come from geographic coordinates, not the image. A visible inherited satellite seam in the upper-left ocean was corrected by a second edit. No text, UI or clouds were baked into these images; clouds can be animated separately.

## Day prompt

Use case: sketch-to-render.
Asset type: 4K landscape aerial master scene for an interactive real-estate exploration website of Itapema, Santa Catarina, Brazil.
Input image: supplied local image is the EDIT TARGET and exact geometric camera reference.
Primary request: Transform this flat satellite-textured 3D terrain render into an exceptional photorealistic aerial architectural visualization. Keep EXACTLY the same 16:9 framing, camera perspective, coastline, beach outline, islands, river paths, highway paths, street grid and hill silhouettes and locations. Do not crop, rotate, zoom, or rearrange any land/water boundaries. All geographic points must stay at their exact image coordinates, so clickable markers stay aligned.
Make the existing urban fabric truly volumetric: realistic white concrete and glass apartment towers typical of southern Brazilian coastal cities, naturally varied building heights, lower houses inland, dense beachfront urbanism, realistic visible facades and cast shadows. Keep their footprints in the urban areas already visible; never build into sea, protected forest, or beach. This is Itapema, not Dubai; no futuristic spires, artificial islands, canals, or invented landmark architecture. Transform the terrain textures into lush Atlantic rainforest with individually resolved tree canopies, natural hillside relief, realistic roads, authentic pale golden sand. Ocean must be photoreal turquoise-blue with subtle tonal depth, tiny wind ripples and fine natural surf lines, while preserving the exact coast. Clean any blocky satellite seams and triangulation artifacts.
Style: premium high-end architectural aerial visualization with convincing photographic materials and fine detail, realistic inhabited scale, beautiful but geographically faithful. Clear warm late-afternoon sunlight with attractive coherent shadows. Crisp clean visibility with subtle atmospheric depth only on distant hills. No sky area is necessary because retain exact source framing.
Output: 3840 x 2160 landscape if available, maximum fine detail.
Constraints: no text, no typography, no place names, no logos, no markers, no interface, no cloud or cloud shadows anywhere. Exact same geographic composition and camera. Entire scene remains uncovered for interactive overlays.

## Ocean seam repair prompt (selected day output)

Use case: precise-object-edit. Input image is the edit target.
Make only ONE repair: In the upper left part of the ocean there are conspicuous hard-edged polygon/triangular patches in the water, which look like satellite tile seam artifacts. Replace ALL these angular polygons and straight seams with continuous natural ocean texture smoothly matching the surrounding blue ocean, gentle fine ripples and organic sunlight shimmer. There should be NO geometric edges, triangles, patch boundaries or abrupt bands visible in any water.
Preserve literally everything else: exact camera, framing, coastline, all land locations, beach, river, buildings, vegetation, roads, color grade and sunshine. Do not alter the coastline or terrain or move any building. The image must remain pixel-aligned to the reference except the corrected ocean pixels. No text, labels, clouds or interface.
Request highest available resolution, 3840x2160 landscape.

## Night prompt (edited from selected day output)

Use case: lighting-weather.
Asset type: matched blue-hour night variation for the exact same interactive Itapema aerial master scene.
Input image is the edit target and exact camera/geometry reference.
Change ONLY time of day and illumination to luxurious early blue-hour twilight/night. Preserve every building, street, coastline, sand outline, hills, river and ALL terrain geometry and camera perspective at exactly the same image coordinates. No additions/removals of objects or changes of architecture. Do not crop, rotate, zoom, tilt or reframe.
Deep blue ocean, dim blue ambient light, visible but subdued forest and land detail, warm amber streetlights following the existing streets and coastal boulevard, natural warm white and occasional cool illuminated apartment windows, credible small pool highlights. Make urban area readable and beautiful with restrained luminous detail, no overblown neon, no neon outlining of buildings or roads, no excessive orange glow. No daylight cast shadows. Fine gentle surf remains legible. Highly realistic premium architectural aerial render, sharp fine detail.
Keep ocean natural and continuous, no hard geometric water artifacts. No clouds, cloud shadows, text, labels, UI, logos, or markers. EXACT same framing and geography as input day image, because the website crossfades between them. Maximum available output resolution landscape 16:9, ideally 3840x2160.

