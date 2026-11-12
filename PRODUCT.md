# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the broker or sales team presenting high-end apartments in Itapema (SC) to a client, usually on a large screen in a sales meeting or at the sales stand. They drive the map live while the client watches, so every interaction is seen by a demanding buyer.

The client watching the presentation is the audience that has to be impressed: an exigent, high-income buyer.

## Product Purpose

Itapema Vista is an interactive aerial map of Itapema that shows where each development sits in the city and what surrounds it: neighborhoods, the BR-101, the beaches and the tourist attractions, with real driving distance and time from each attraction to each development.

Success: the presenter moves from the city view to a neighborhood to the development page smoothly, and the client understands the location and its value without the map ever looking broken or imprecise.

## Positioning

A presentation-grade, art-directed aerial view of Itapema (pre-rendered scenes, not a generic web map), where neighborhoods, the BR-101 and routes are hand-fitted to the image and routes come from real road data (OpenStreetMap), so the geography stays credible while the visual stays premium.

## Operating Context

- Navigation in three levels: city (Itapema) → neighborhood view (Canto da Praia & Centro, Meia Praia) → development view (architectural perspective).
- Map layers controlled by a small filter: tourist attractions, developments, neighborhoods (neighborhoods off by default).
- Tourist attraction preview on the side: image, name, km and minutes by car to the selected development, short description, list of developments; a route line is drawn from the attraction to the development.
- Static site served from `dist/` (Node `serve.mjs`, `iniciar.bat`); no backend, no login, no forms, no external calls at runtime.
- Geometry tooling in `tools/` (route projection, BR-101 clipping, neighborhood refinement).

## Capabilities and Constraints

- Plain HTML/CSS/JS, no framework; Three.js and MapLibre vendored in `dist/vendor/`.
- Must stay smooth on an integrated GPU (Intel UHD): no per-frame backdrop-filter or filter on large moving elements.
- Neighborhoods never overlap the BR-101; neighbors share exactly the same border; habitable areas are not left without a neighborhood; neighborhoods cover houses and streets, not the hills (except Canto da Praia).
- Distances and times come from OSRM/OpenStreetMap, computed offline into `dist/drive.json`.
- Open: the real developer/real-estate brand, final development names and addresses (current ones are mockups).

## Brand Commitments

- Visual identity set by the user: black and white, Poppins family with clear text hierarchy.
- Motion must be subtle and fluid: nothing abrupt; entrances by opacity + blur in place; hovers change color only (no scale: scaling blurred text and caused a jolt).
- High-end standard: every detail must look polished; the audience is demanding and the project is expensive.

## Evidence on Hand

- Pre-rendered day/night aerial images in `dist/renders/`; architectural perspectives in `dist/renders/architecture/`.
- The four developments (Brisa do Canto, Vista Central, Horizonte, Atlântico Sul) and their addresses are test data; the tourist attractions are real places with mockup descriptions.
- No testimonials, pricing, sales figures or contact channels exist; none must be invented.

## Product Principles

1. Precision is credibility: lines, borders and routes must match the image exactly.
2. The presenter is in control: interactions are predictable and calm in front of a client.
3. Premium through restraint: monochrome, refined type, subtle motion.
4. Performance is part of quality: no stutter on ordinary hardware.
