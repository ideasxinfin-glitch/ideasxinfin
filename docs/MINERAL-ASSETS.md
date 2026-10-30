# Mineral photographic assets

Created 2026-10-28 for the approved Ideas Xinfin mineral redesign. All four are original synthetic photographs generated using the built-in image_gen tool (four calls). They depict illustrative concepts, not client work or documented real properties/products. No stock-photo downloads or external source images were incorporated.

## Files and optimization

Project root: `C:/Users/Felipe Plascencia/Documents/Xinfin/ideasxinfin`

| Asset under public/assets | Dimensions | Bytes | Composition |
| --- | --- | ---: | --- |
| scene-mineral-dark.webp | 1672 x 941 | 254578 | Overcast lakeside glass/timber villa right, lake and mountains left |
| scene-mineral-light.webp | 1672 x 941 | 354866 | Daylight lighting/weather edit of the dark hero, matching geometry |
| services-mineral.webp | 2172 x 724 | 151332 | Equal thirds: laptop / workflow monitor / editorial campaign layouts |
| portfolio-mineral.webp | 2172 x 724 | 285116 | Equal thirds: graphite coupe / tropical residence / fragrance still life |

Converted with Node sharp, WebP quality 84, effort 6. No aesthetic changes, compositing or color processing outside image_gen. No enlargement. Both strips have exact 3:1 dimensions and three adjacent 724-pixel square panels, allowing independent CSS crops at left/center/right. Visually inspected originals and final WebP outputs. Total payload: 1,045,892 bytes (about 1 MiB) for all four files.

## Original sources (retained)

Source directory: `C:/Users/Felipe Plascencia/.codex/generated_images/01a1829a-fb45-7653-9887-5dcf804a1e47/`

- Dark: `exec-f84d75b9-518a-473f-a3b8-4d0c2f4bbdc7.png`
- Light: `exec-2c895be0-1a45-4860-80bb-6bf30856a717.png`
- Services: `exec-5416fba3-ac75-429e-b249-7dfe3c836f4b.png`
- Portfolio: `exec-4da04d76-dfa3-465b-8cb9-f9493e9fc7c5.png`

Visual direction reference inspected before generation: `C:/Users/Felipe Plascencia/.codex/generated_images/01a1809d-8f52-7660-8a64-5c1ccc9b1106/exec-b2481ae1-7860-4eb6-8f95-6e98be63f0a9.png`. This was used as a composition/style reference, not embedded into the generated assets.

## Prompt set

1. **Hero / photorealistic-natural:** Original full-bleed 16:9 architectural photograph, restrained single-story timber and glass villa on the right, real alpine lake and layered rocky mountains with moderate snow, quiet lake/forest left for website copy, natural stone shoreline. Overcast late afternoon, neutral graphite exposure, subtle warm-white interiors, moderate contrast and muted stone/pine palette. Exclude text, UI, devices, logos, people, orange sunset, HDR and fantasy peaks.
2. **Light hero / lighting-weather:** Edit only the dark hero time/weather to bright natural late morning with pale-blue sky and delicate clouds; naturally lighter lake and forest. Preserve camera, framing, mountain geometry, villa, furniture, roof, tree locations, rocks and shoreline. Muted realistic stone and pine/sage palette. Exclude overexposure, orange sunset, HDR, extra objects, text, UI, devices and logos.
3. **Services / photorealistic-natural:** Exact three equal adjacent square photographic panels, total 3:1, with seams at one-third and two-thirds and no gaps/borders. Left: slim graphite laptop showing refined architectural website on neutral wood desk. Center: monitor displaying simple connected blue-gray workflow nodes on white canvas on a real professional desk. Right: overhead editorial campaign print layouts, architectural lifestyle photos, whitespace, pencils and swatches. Centered subjects, natural daylight, stone/gray/sage palette, no people, floating logos, holograms, brand names or captions.
4. **Portfolio / photorealistic-natural:** Exact three equal adjacent square photographs, total 3:1, no gaps/borders/captions. Left: graphite sports coupe outside contemporary concrete building in natural daylight. Center: tropical concrete/stone and glass residence, restrained palms, pool. Right: unbranded clear fragrance bottle, stone jar and sage packaging on limestone in soft daylight. Restrained neutral commercial photography, real textures, no people, orange sunset, glow, holograms or text overlays.

## Integration notes

Hero photographs contain no UI or device mockups; the existing HTML laptop and phone provide those elements. Headline readability requires the theme-specific CSS surface/gradient overlay. Portfolio illustrations should retain their concept labels rather than imply commissioned client work. The vehicle is a generated generic sports coupe and is not a verified model or manufacturer.
