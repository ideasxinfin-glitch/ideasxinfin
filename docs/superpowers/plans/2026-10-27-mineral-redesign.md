# Ideas Xinfin mineral redesign implementation plan

> **For agentic workers:** use subagent-driven-development with separate file ownership and a final independent review.

**Goal:** Implement the user's approved graphite/stone and mineral-white visual proposal while retaining the original immersive composition, logo, serif headings, device showcase and service hierarchy.

**Architecture:** Preserve the dependency-free HTML/CSS/JavaScript site and existing contact flow. Replace oversaturated imagery with optimized natural photographic assets; consolidate styles and progressively enhance movement. Keep the existing feature checkout and do not publish or push during implementation.

**Tech Stack:** HTML, CSS, native modules, Node 24, local WebP assets.

**Spec:** User approved the side-by-side mineral proposal on 2026-10-27, asking for expert implementation with animations. Reference image: C:/Users/Felipe Plascencia/.codex/generated_images/01a1809d-8f52-7660-8a64-5c1ccc9b1106/exec-b2481ae1-7860-4eb6-8f95-6e98be63f0a9.png.

## Global constraints
- Preserve original complete logos and the recognizable hero/device layout.
- Natural photographic color, no orange glows, holograms or fabricated client claims.
- Dark graphite #191C1E, surface #252A2D, pale stone accent; light mineral white #F6F6F3, charcoal text and slate accents.
- No production dependencies, trackers, unrequested external services or fake conversion statistics.
- Retain WhatsApp inquiry review, privacy notice, concept labels, theme persistence, video on demand and preview noindex.
- No autoplay audio/video, scroll hijacking or cursor replacement. Honor reduced motion and pause controls, keep content visible without JS.

## Review focus
- Mobile 360/390px navigation, device overflow, long Spanish text and form widths.
- Both theme contrast and readable text over photography.
- Keyboard dialog focus, Escape, service selection, validation and inquiry URL preparation.
- Reduced-motion OS setting, manual pause, hidden-tab suspension and theme persistence.
- Local asset resolution, built output CSP, JS errors and image payload.

## Tasks
- [x] 1. Visual system: replace public/styles.css with readable consolidated styling, including responsive devices, service imagery, project detail, workflow illustration, FAQ and contact. Owner: design specialist.
- [x] 2. Motion: revise public/motion.js, add meaningful behavioral tests for pause/reduced motion and keep non-JS fallback. Owner: interaction specialist. Interfaces: .hero-copy, .device-stage, .environment, .service-card, .project, .workflow-node, .workflow-panel, .motion-toggle, .header, #contact-form. Motion custom props --hero-drift, --device-x, --device-y; root .motion-on/.motion-suspended; respect CSS reduced-motion rules.
- [x] 3. Photography: generate original new natural imagery, optimize WebP using Node sharp, retain originals and provenance. Assets: scene-mineral-dark.webp, scene-mineral-light.webp, services-mineral.webp (three equal horizontal panels, each independently cropped with CSS), portfolio-mineral.webp (three equal horizontal panels). Owner: asset specialist; generation tooling only for image editing.
- [x] 4. Content/integration: preserve hero and current interaction hooks, refine service and contact copy, replace artificial portrait with useful workflow diagram, add concise FAQ and selected-project visual dialog. Owner: coordinator. Keep data-service values and contact.js contract.
- [x] 5. Verify: Node lint/tests/build, browser desktop/mobile both themes, keyboard and motion, image/asset requests and console; independent review; fix findings and show local preview and screenshots. Update graph with graphify update . and document any tool limitation.

## Execution record
- Baseline clean on feature/nueva-web-ideas-xinfin at 9823b9f. User explicitly authorized implementation and specialist collaboration; no additional design approval is needed.
- Parent graph query was available but broadly indexed unrelated projects; source inspection is required for this landing.

- Final verification 2026-10-29: 10/10 Node tests; lint and build passed. Chrome checked both themes at 360, 390, 768, 1024 and 1440px. Fixed tablet hero overlap. Navigation, FAQ, project dialog, theme persistence, reduced motion and saved pause passed. WhatsApp URL intercepted locally without sending a message. No JavaScript runtime errors observed.
- Independent interaction review found entrance transforms overriding device rotation; changed to independent translate and confirmed unchanged rotation matrix during and after entry in Chrome.
- Graph updated; six JSON configuration/report files yielded zero AST nodes (tool limitation).
- Local review at http://localhost:4175. No commit, push or deployment performed.
