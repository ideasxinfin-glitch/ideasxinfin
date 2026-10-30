# Service campaign imagery · 2026-10-29

Deployment update 2026-10-30: all process, automation and contact revisions below are now published to production and preview. Any earlier “local/pending deployment” notes describe their creation stage. Production version `693de030-64c0-42f3-a5a1-512d73ffc288`; preview `f5967ea6-33f2-4d93-96d8-5f3f1a55be53`. Verified public files match build output and all 46 old routes retain their redirects.

## Process storytelling · 2026-10-30

User approved a four-stage process mockup and requested actual integration with meaningful image content and the explanatory copy retained. Four individual square photographs were recreated using built-in image_gen from approved mockup `exec-88f427c4-392f-4cb6-b769-0d29c4610f69.png`. All depict the same fictional FORMA wellness studio, with ivory/sage identity and stone desk. They are illustrative, not real clients or metrics.

| Final asset in public/assets | Original PNG | WebP bytes |
| --- | --- | ---: |
| process-listen.webp | exec-20bd5fe9-33d7-4556-9708-4927ff1daa7d.png | 92498 |
| process-design.webp | exec-23e4d77f-e32c-4a47-b4c2-3f453a2107f1.png | 126126 |
| process-build.webp | exec-74b99bef-472b-47e5-ad5e-64929993d78e.png | 89580 |
| process-evolve.webp | exec-1a71eeb0-a99a-4e4b-80d6-d90d648fe2a9.png | 93770 |

Optimized using sharp, 800×800 WebP quality 88. Originals remain in session generated_images/01a1809d-8f52-7660-8a64-5c1ccc9b1106.

Shared prompt: recreate the corresponding approved photo as one edge-to-edge square editorial photograph, same FORMA identity, natural daylight, realistic geometry and meaningful Spanish UI/physical notes. Remove mockup framing, step headings and captions; keep those as HTML. No neon, glowing circuits or futuristic effects.

Individual subjects: (1) listening hands/tablet and Objetivos notebook, (2) wireframes, typography, color swatches and landing mockup, (3) finished responsive landing on laptop and phone with CTA plus supporting code screen, (4) consultation/reservation dashboard, same website and Siguiente fase notes. Preserve the embedded headlines, goals and service/booking controls so imagery explains the stage.

Integrated above original four titles/descriptions, thin milestones, and illustrative disclosure. Layout: 4 columns desktop, 2 at ≤1050px, 1 at ≤600px. Existing reveal controller and reduced-motion behavior retained. Loading lazy, explicit dimensions and descriptive alt text. Checked both desktop themes, tablet and mobile without horizontal overflow. Local revision pending deployment.

## Automation section visual · 2026-10-30

### Contact studio background · 2026-10-30

Latest screen revision requested by user: active asset is now `contact-creative-studio-purpose.webp`, sibling of the original. Built-in image edit `exec-b4c423dd-6d8b-42fd-9381-506ec27efde2.png` preserved the studio and replaced the monitor content with a legible dark agency landing: “Diseño digital para negocios con propósito.”, supporting strategy/design/technology copy and “Hablemos” CTA. WebP quality 90 to preserve small screen lettering. No new deployment.

User approved a generated contact-section mockup and requested integration. Generated a separate clean environment photograph, not a flattened mockup. Asset: `public/assets/contact-creative-studio.webp`, 1672×941, 184528 bytes, WebP quality 86. Original: `exec-1940bd1a-7ad6-4c75-b9f8-4073b25d8377.png`. Synthetic illustrative studio, not a claim about agency premises.

Prompt: Wide 16:9 premium editorial creative studio photograph, graphite plaster wall with upper-left negative space, limestone worktable, printed wireframe sketches, upright monitor with a refined business landing page, notebook, pencil holder, leather chairs, sheer window and olive foliage on right. Muted stone/graphite/olive, natural side light, controlled contrast. No text or form overlays, people, robots, neon, orange sunset, floating UI or abstract blobs.

CSS contact background with theme-specific legibility overlays, solid form surface, mobile crop and fade into page surface. Existing content, inputs and WhatsApp behavior retained. Desktop screenshots in both themes and 390px overflow check completed; lint and all 15 tests pass. Local revision, not yet deployed.

Added `public/assets/automation-opportunity.webp` (1120×1400, 131774 bytes), generated with built-in image_gen. Original: `exec-0ae0a7ca-ac60-4077-aa87-2495e10439a0.png` in the session's generated_images directory. Optimized with sharp, WebP quality 87. Fictional illustrative workflow, not an actual CRM integration or customer results.

Prompt: Portrait 4:5 premium editorial technology photograph on pale limestone desk, graphite wall and natural side light. Upright smartphone displays recognizable WhatsApp conversation in Spanish asking for a quotation. Behind it, desktop monitor shows a clear light CRM dashboard with opportunity columns and a calendar appointment confirmed. Muted sage green and ivory, accurate device geometry, tactile materials. Leave lower stone surface for HTML caption. No robots, brains, neon, orange glow or holograms.

Replaced the text-only left panel in the automation section with this photograph and an HTML caption/illustrative disclosure. Preserved the three-step controller as a compact responsive sequence below the image; existing reduced-motion and visibility handling remain. Desktop dark/light and 390px mobile reviewed; 15 tests and lint pass. This revision is local until a deployment is requested.

Generated with the built-in image_gen tool. Synthetic illustrative concepts, not client work. Original PNGs retained in the Codex generated_images directory. Individual 1200px WebP files, quality 86, approximately 474 KiB combined.

## Prompts and final assets

### public/assets/service-platforms-editorial.webp
Landscape 3:2 premium agency service-card image: bespoke digital platforms and landing pages. Sculptural editorial product photography, charcoal aluminum laptop opened diagonally on dark limestone, display showing a full-bleed coastal architecture website, slim upright phone showing matching mobile layout. Architectural studio with curved off-white wall, dramatic diagonal afternoon sunlight, graphite shadows, travertine texture and muted olive. Low three-quarter camera, devices fill frame, readable thumbnail silhouette, medium-format technology campaign. No holographic panels, orange glow, purple gradients, office clutter, logos or text outside screens.
Original: exec-b138a114-f519-4a94-8875-2690848703d4.png.

### public/assets/service-automation-editorial.webp
Landscape 3:2 high-end agency card: intelligence and automation. Premium physical sculptural installation in a dark architectural gallery. Central brushed-titanium cube on graphite pedestal, three slender solid curved pale-metal channels connecting frosted-glass modules with engraved communication, calendar and checkmark pictograms. Restrained warm ivory channel light, no neon. Symmetrical three-quarter view, tactile metal, caustics on dark stone, directional softbox light, mint-tinted glass edge. Luxury industrial design, precise geometry, strong thumbnail silhouette. No monitor, office, robot, face, brain, glowing orb, gold, orange, floating holograms, text or logos.
Original: exec-5e1a0589-8f2c-4e78-aa91-0ffde91d983c.png.

### public/assets/service-marketing-editorial.webp
Landscape 3:2 bold editorial agency card for marketing, social media and SEO. Complete bespoke campaign identity as physical still life: oversized deep forest green poster against chalk travertine, refined ivory word DISTINTO, smoked-glass perfume bottle on charcoal block, ivory embossed identity cards, diagonal graphite smartphone with coordinated brand campaign and product photography. Off-center graphic composition, raking daylight, architectural shadows, ivory and forest green, restrained amber glass glint. Medium-format luxury fashion campaign, tactile paper, deliberate scale and hierarchy. No social network logos, charts, floating icons, neon, orange glow, gradients or office desk. No website border or overlay text.
Original: exec-39b96888-cbd2-44ed-be93-4579dc7f14d8.png.

## Interaction

Removed pause control and saved animation preference. Motion defaults on, honors OS reduced motion, suspends in hidden tabs. WhatsApp: restrained halo, light sweep and icon invitation once every eight seconds; reduced motion disables these effects. Service photographs gain a subtle hover zoom.

## Revision: recognizable business experiences · 2026-10-29

Built-in image_gen generation, three separate original prompts, optimized with sharp to 1400px WebP quality 89. Originals retained in generated_images/01a1809d-8f52-7660-8a64-5c1ccc9b1106. All brands and campaign results are illustrative concepts.

- public/assets/service-platforms-landing.webp (exec-a0c6b3e6-02f2-41d0-95aa-6ee2337f1c14.png). Prompt: Landscape 3:2 premium advertising photograph. Straight-on eye-level level camera, undistorted rectangular graphite laptop and upright phone on ivory desk. Complete Spanish landing for fictional wellness studio FORMA: navigation, elegant headline Tu mejor versión empieza aquí, olive Reserva tu sesión CTA, supporting copy, pilates studio photo on half of hero, three service tiles and appointment strip. Same responsive layout on phone. Devices fill frame, believable crisp UI, warm neutral lighting. No wallpaper, skewed devices, orange glow or floating UI.
- public/assets/service-marketing-social.webp (exec-26ffd44d-ae25-4178-b176-37f6bc6086ce.png). Prompt: Landscape 3:2 sophisticated digital marketing campaign presentation for artisan coffee ORIGEN. Cream/deep-teal coffee package and espresso cup, upright phone showing recognizable Instagram post and camera logo, rectangular Facebook campaign page with blue f logo, adjacent search results panel Café de especialidad with business listing. Instagram and Facebook acrylic logo badges at base. Layered physical composition, daylight, ivory studio, teal plinth, warm coffee browns, controlled platform colors. Clear thumbnail hierarchy. No perfume, neon or floating icons.
- public/assets/project-origen-brand.webp (exec-f4e2c779-b81c-49b3-a733-740105f7a0a2.png). Prompt: Square premium portfolio concept, complete artisan coffee ORIGEN brand system. Cream bag with teal ORIGEN typography and botanical art, espresso cup, coffee beans, campaign poster Un buen día empieza aquí, upright phone showing ecommerce landing, product photo and Descubrir CTA. Pale limestone plinth, sunlight and architectural shadows, forest teal/ivory and coffee brown. Main objects in upper 70 percent for lower website caption. Realistic tactile materials, rectangular device, no perfume or fabricated client outcomes.

Card media now preserves full 3:2 composition. Replaced branding project image in card and its shared dialog, renamed concept to Origen. Added small accent rule to card body with restrained hover extension.
