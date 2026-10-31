# MacroCap visual reference for PlannerMC

**Fecha de observación:** 2026-10-29  
**Source:** [MacroCap Operations / Production Operations](https://ops.macrocaplabs.com/production-operations/daily-overview) and [MacroCap Labs logo asset](https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif)

## Brand identity observed

- **Wordmark:** MacroCap Labs.
- **Application title:** MacroCap Operations.
- **Logo asset:** AVIF at https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif, image alt MacroCap Labs, intrinsic size 224×71 px.
- **Logo construction:** cyan MacroCap wordmark with a small laboratory/flask-style mark, green LABS and green horizontal rules.
- **Trademark mark:** no ™ or ® character was visible in the sign-in or Daily Overview views inspected. This records those views only.
- **PlannerMC direction:** the user requested using MacroCap branding, logo, icons, wordmark/trademark treatment and palette for PlannerMC. [Inference] Keep the product name PlannerMC unless the user later chooses a different product name; use MacroCap Labs as the visible brand identity.

## Measured dark-theme tokens

Values were read from the public sign-in page's computed CSS custom properties. CSS lab() neutrals were converted by the browser canvas to sRGB for the hex column. These are observed theme tokens, not a separate brand-guideline document.

| Role | CSS token | Observed value |
| --- | --- | --- |
| Main background | --background | #0A0A0A |
| Foreground text | --foreground | #FAFAFA |
| Card surface | --card | #171717 |
| Secondary / accent surface | --secondary, --accent | #262626 |
| Muted surface | --muted | #0F0F0F |
| Muted text | --muted-foreground | #A1A1A1 |
| Interface primary | --primary | #BCD3E0 |
| Primary foreground | --primary-foreground | #101010 |
| Focus ring | --ring | #9FC0D4 |
| Destructive signal | --destructive | #DDADAA |
| Chart 1 | --chart-1 | #A6C4D8 |
| Chart 2 | --chart-2 | #88B294 |
| Chart 3 | --chart-3 | #B1CDB5 |
| Logo cyan | Sampled dominant AVIF pixels | approximately #00A7CA |
| Logo green | Sampled dominant AVIF pixels | approximately #59BB4E |
| Border | --border | white at 10% opacity |
| Input border | --input | white at 15% opacity |

Logo sample colors are approximate because the AVIF contains antialiasing and compression. The interface primary is pale blue; it is distinct from the brighter cyan logo color.

## Typography and icon style

- **UI font:** Geist Variable, with a system sans-serif fallback.
- **Icons:** thin outline style, generally gray/white on dark surfaces; the brand mark and selected data signals supply color. The underlying icon package was not verified, so do not assume a library name.
- **Controls:** the inspected sign-in inputs and buttons use 6 px corner radii; the page uses fine translucent borders.
- **Dashboard layout:** compact left icon rail, top breadcrumb/action strip, date controls, KPI cards, charts and dense data tables. Semantic status badges use stronger color than the neutral chrome.

## Use in PlannerMC design work

1. Use the original MacroCap Labs logo asset and preserve its aspect ratio; do not approximate its lettering or mark.
2. Apply the observed dark palette and Geist Variable to PlannerMC's application chrome.
3. Use the pale blue interface primary for primary actions/focus and reserve the sampled cyan/green combination for logo treatment and restrained brand accents.
4. Use thin outline icons and the compact dashboard framing visible in MacroCap Operations.
5. Keep semantic state colors distinguishable from brand colors. Do not treat every status as cyan or green.
6. Keep the logo alt text MacroCap Labs; accessible labels for icon-only controls must state the action.

## Not observed

- Light-theme token values. The UI offered a light-mode switch; it was not activated.
- Official brand guideline, downloadable icon library, font license/hosting terms, or an explicit ™/® policy.
- Whether the AVIF logo URL is intended as a permanent production asset URL. This exact URL was observed on the site; local asset packaging can be decided during design/build.
