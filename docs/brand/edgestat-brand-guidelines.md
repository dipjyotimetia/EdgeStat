# Edgestat Brand Guidelines

**Version 1.0 · Electric Teal palette**

> Analytics at the edge. Owned by you.

---

## Contents

1. [Brand Identity](#1-brand-identity)
2. [Logo](#2-logo)
3. [Colour Palette](#3-colour-palette)
4. [Typography](#4-typography)
5. [Voice & Tone](#5-voice--tone)
6. [Taglines](#6-taglines)
7. [Logo Usage — Do & Don't](#7-logo-usage--do--dont)
8. [In-Context Usage](#8-in-context-usage)
9. [File Formats & Assets](#9-file-formats--assets)

---

## 1. Brand Identity

Edgestat is a self-hosted, privacy-first analytics engine built entirely on Cloudflare's free tier. It is open-source, developer-owned, and deploys in a single command.

The brand reflects three core values:

| Value | What it means |
|---|---|
| **Ownership** | Your data lives in your Cloudflare account. Nobody else touches it. |
| **Precision** | Edge-computed stats. Millisecond latency. No sampling tricks. |
| **Simplicity** | One command to deploy. Zero config to track your first event. |

The visual identity is technical, confident, and clean — built for developers who are comfortable in a terminal but expect a polished dashboard when they open a browser.

---

## 2. Logo

### 2.1 The mark

The Edgestat icon is a hexagon containing a three-bar chart with a baseline. The hexagon references the Cloudflare edge network — a distributed polygon of nodes. The bar chart inside is the product: stats, rendered at the edge.

```
     ___
    /   \        Three bars of descending height
   | ▐▌  |       anchored to a baseline inside
   | ▐▌▐ |       a clean hexagonal container.
    \___/
```

The tallest bar (centre) is always rendered in **Mint** (`#00FFD1`). The flanking bars are in **Teal** (`#00D4AA`). The baseline is in **Surface** (`#0D3D30`). This hierarchy signals: the primary metric is always the brightest thing in the mark.

### 2.2 Wordmark

The wordmark is set in a monospace typeface. The word splits into two weights:

- `edge` — **weight 700** · colour: Mist `#E2F9F5`
- `stat` — **weight 300** · colour: Teal `#00D4AA`

The weight contrast communicates the product's two layers: the infrastructure layer (`edge`, bold, structural) and the data layer (`stat`, light, informational).

```
edgestat
━━━━┳━━━━
    ┗ weight split at the syllable boundary
```

The optional tagline below the wordmark is set in the same monospace face, uppercase, tracked at `0.14em`:

```
ANALYTICS AT THE EDGE
```

### 2.3 Variants

| Variant | When to use |
|---|---|
| Icon + wordmark (horizontal) | README headers, landing page nav, documentation |
| Icon only | Favicons, npm badges, GitHub org avatar, app icons |
| Mono white | Single-colour contexts: embroidery, stamps, dark print |
| Light version (Mist bg) | Light-mode dashboards, printed materials |

### 2.4 Clear space

Always maintain a minimum clear space equal to the height of the letter `e` in the wordmark on all four sides of the logo. Never crowd the mark against other elements.

### 2.5 Minimum sizes

| Format | Minimum size |
|---|---|
| Icon only | 16 × 16 px |
| Icon + wordmark | 120 × 28 px |
| Print | 8mm × 8mm (icon only) |

---

## 3. Colour Palette

### 3.1 Primary palette

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--es-void` | Void | `#050B14` | Page background |
| `--es-deep` | Deep | `#0A2540` | Card / nav background |
| `--es-surface` | Surface | `#0D3D30` | Elevated surfaces, borders |
| `--es-teal` | Teal | `#00D4AA` | Primary accent, interactive elements |
| `--es-mint` | Mint | `#00FFD1` | Highlights, data values, hero numbers |
| `--es-aqua` | Aqua | `#7FFFD4` | Secondary text on dark backgrounds |
| `--es-mist` | Mist | `#E2F9F5` | Primary text on dark backgrounds |

### 3.2 Semantic usage

```
Page background   →  Void    #050B14
Card background   →  Deep    #0A2540
Border / divider  →  Surface #0D3D30
Primary accent    →  Teal    #00D4AA
Hero data value   →  Mint    #00FFD1
Body text (dark)  →  Mist    #E2F9F5
Muted text (dark) →  Aqua    #7FFFD4
Dimmed text       →  Label   #1E6B5A
```

### 3.3 CSS design tokens

Copy this block into your project's root stylesheet:

```css
:root {
  --es-void:    #050B14;   /* page background        */
  --es-deep:    #0A2540;   /* card / nav background  */
  --es-surface: #0D3D30;   /* elevated surface / borders */
  --es-teal:    #00D4AA;   /* primary accent         */
  --es-mint:    #00FFD1;   /* highlight / data values */
  --es-aqua:    #7FFFD4;   /* secondary text on dark */
  --es-mist:    #E2F9F5;   /* primary text on dark   */
  --es-label:   #1E6B5A;   /* dimmed / metadata text */
  --es-dim:     #1E4D44;   /* subtle borders         */
}
```

### 3.4 Accessibility

All text/background combinations in the primary palette meet **WCAG AA** contrast requirements:

| Text | Background | Contrast ratio |
|---|---|---|
| Mist `#E2F9F5` | Void `#050B14` | 16.4 : 1 ✓ |
| Mint `#00FFD1` | Void `#050B14` | 12.1 : 1 ✓ |
| Teal `#00D4AA` | Void `#050B14` | 9.8 : 1 ✓ |
| Teal `#00D4AA` | Deep `#0A2540` | 8.2 : 1 ✓ |
| Void `#050B14` | Mist `#E2F9F5` | 16.4 : 1 ✓ |

---

## 4. Typography

### 4.1 Typeface

Edgestat uses a **monospace typeface** exclusively. This is a deliberate brand decision — analytics is a developer tool, and monospace signals that clearly without over-explaining it.

**Preferred stack (in order):**

```css
font-family: ui-monospace, 'Cascadia Code', 'Fira Code',
             'JetBrains Mono', 'Source Code Pro', monospace;
```

Do not use sans-serif or serif faces anywhere in the product or brand materials.

### 4.2 Type scale

| Role | Size | Weight | Colour | Usage |
|---|---|---|---|---|
| Display | 28–32px | 700 | Mist | Page titles, hero headings |
| Wordmark | 20–24px | 700 / 300 | Mist / Teal | Logo only |
| Heading | 18px | 700 | Mist | Section headings |
| Body | 14px | 400 | Aqua | Paragraphs, descriptions |
| Data value | 20–24px | 700 | Mint | Metric cards, stat numbers |
| Label | 10–11px | 500 | Label `#1E6B5A` | Uppercase tracked labels |
| Code | 13px | 400 | Aqua / Mint | CLI output, snippets |

### 4.3 Label treatment

All uppercase labels (stat card labels, section markers, badge text) use:

```css
font-size: 10px;
font-weight: 500;
letter-spacing: 0.1em;
text-transform: uppercase;
color: #1E6B5A;
```

Never use uppercase for body copy or headings outside of this label context.

### 4.4 Wordmark weight split

When rendering the wordmark in code:

```html
<span style="font-weight: 700; color: #E2F9F5;">edge</span>
<span style="font-weight: 300; color: #00D4AA;">stat</span>
```

The split always happens at the syllable boundary. Never alter this split or unify the weights.

---

## 5. Voice & Tone

### 5.1 Personality

Edgestat speaks like a senior engineer who happens to write well. Direct, technically precise, no fluff — but never cold. The project cares about the user's data sovereignty, and that comes through.

| Trait | In practice |
|---|---|
| **Direct** | Lead with the outcome. "Deploy in one command" not "Edgestat makes it easy to get started." |
| **Precise** | Use exact numbers. "18ms p95 latency" not "really fast." |
| **Honest** | Acknowledge tradeoffs. Free tier limits exist. Say so. |
| **Warm** | Open source is a community. Contributor docs should feel welcoming. |

### 5.2 Writing style

- Sentence case everywhere — including headings and button labels.
- Avoid exclamation marks in UI copy. Reserve them for genuine moments (first successful deploy).
- Write for scanning. Short sentences. Active voice. No preamble.
- Refer to the product as **edgestat** (lowercase) in body copy, `edgestat` in code.

### 5.3 Examples

**Do:**

> Deploy to Cloudflare in one command. Your data stays in your account — always.

> 18ms p95 · 12,401 visitors · no cookies.

> Something went wrong deploying your Worker. Check your `wrangler.toml` binding for D1.

**Don't:**

> Edgestat is an amazing analytics solution that empowers you to take control of your data!

> We are unable to process your request at this time.

> Click here to get started.

---

## 6. Taglines

The recommended tagline is:

> **Analytics at the edge. Owned by you.**

The two sentences do distinct work. The first is the technical USP. The second is the privacy/ownership promise. They should appear together wherever possible.

Alternative taglines (approved for use):

| Tagline | Context |
|---|---|
| Analytics at the edge. Owned by you. | Primary — all contexts |
| Your data. Your Cloudflare. Your rules. | Developer-focused copy, README lede |
| Open-source analytics built for the edge. | Comparison pages, product directories |
| Deploy once. Track everything. Own it all. | CLI onboarding, launch copy |

---

## 7. Logo Usage — Do & Don't

### Do

- Use the dark-background version on dark surfaces (`#050B14`, `#0A2540`, `#0D1117`)
- Use the light-background version on light surfaces (`#E2F9F5`, white)
- Use the mono-white version for single-colour print or embroidery
- Maintain clear space on all sides
- Scale the icon proportionally — never stretch or squash

### Don't

- Don't change the bar colours inside the hexagon
- Don't rotate the hexagon — it should always sit flat-edge-bottom
- Don't place the logo on a background that has insufficient contrast (< 4.5:1)
- Don't add drop shadows, glows, or effects to the mark
- Don't use the wordmark without the icon except in running body text references
- Don't recolour the mark outside of the three approved variants (dark, light, mono white)
- Don't place any other brand mark within the clear space zone

---

## 8. In-Context Usage

### 8.1 Dashboard navigation bar

```
bg:        Deep   #0A2540
border:    Surface #0D3D30 (bottom, 0.5px)
logo:      icon (22px) + wordmark (14px, weight 700/300)
live dot:  Mint #00FFD1, 6px circle
live text: Teal #00D4AA, 11px
```

### 8.2 Metric / stat cards

```
bg:        Deep   #0A2540
border:    Surface #0D3D30 (0.5px, all sides)
radius:    8px
label:     10px · uppercase · tracked · Label #1E6B5A
value:     22px · weight 700 · Mint #00FFD1
delta:     10px · Teal #00D4AA
```

### 8.3 Attribution badge

For embedding in third-party sites that use Edgestat:

```html
<div style="
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #050B14;
  border: 0.5px solid #0D3D30;
  border-radius: 99px;
  padding: 4px 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #7FFFD4;
">
  <!-- edgestat icon svg here -->
  Powered by <span style="color: #00FFD1;">edgestat</span>
</div>
```

### 8.4 GitHub repository

- **Org avatar:** Icon only, dark variant, 96 × 96px
- **README header:** Icon (48px) + horizontal wordmark + tagline + pill badges
- **Badge pills:** `background: #0A2540` · `color: #00D4AA` · `border: 0.5px solid #1E4D44` · `border-radius: 99px`

Recommended README badges:

```markdown
![open source](https://img.shields.io/badge/open%20source-edgestat-00D4AA?style=flat-square&labelColor=050B14)
![cloudflare](https://img.shields.io/badge/cloudflare-native-00D4AA?style=flat-square&labelColor=050B14)
![free tier](https://img.shields.io/badge/free%20tier-only-00FFD1?style=flat-square&labelColor=050B14)
```

### 8.5 CLI output

CLI messages follow this colour convention:

| Type | Colour | Token |
|---|---|---|
| Prompt `$` | Dimmed | `#1E6B5A` |
| Command text | Mist | `#E2F9F5` |
| Success `✓` | Teal | `#00D4AA` |
| Progress info | Aqua | `#7FFFD4` |
| URL / output | Mint | `#00FFD1` |
| Error `✗` | Red | `#FF4D4D` |

---

## 9. File Formats & Assets

### 9.1 Asset checklist

The following files should be present in `docs/brand/` in the repository:

```
docs/brand/
├── guidelines.md               ← this document
├── icon/
│   ├── edgestat-icon-dark.svg
│   ├── edgestat-icon-light.svg
│   ├── edgestat-icon-mono.svg
│   └── edgestat-favicon.ico
├── wordmark/
│   ├── edgestat-wordmark-dark.svg
│   └── edgestat-wordmark-light.svg
├── social/
│   ├── edgestat-og-image.png   ← 1200×630px
│   └── edgestat-github-social.png
└── brand-kit.html              ← interactive reference
```

### 9.2 SVG usage notes

- All SVG assets must embed fonts or use the system monospace stack — do not rely on external font loading
- SVG icon viewBox is always `0 0 72 72`
- Border radius on the icon container: `rx="16"` for large sizes, `rx="10"` for 24px and below
- Never rasterise the icon below 96px — use SVG at all sizes where possible

### 9.3 Favicon

The favicon uses the icon-only mark on a **Deep** (`#0A2540`) background with `rx="10"`. Export at: 16×16, 32×32, 48×48, and 180×180 (Apple touch icon).

---

*Edgestat brand guidelines — maintained by the core team.*
*Questions or suggestions → open an issue in `dipjyotimetia/edgestat`.*
