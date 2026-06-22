---
name: Velocity Dark
colors:
  surface: '#0d150e'
  surface-dim: '#0d150e'
  surface-bright: '#323c33'
  surface-container-lowest: '#081009'
  surface-container-low: '#151e16'
  surface-container: '#19221a'
  surface-container-high: '#232c24'
  surface-container-highest: '#2e372e'
  on-surface: '#dbe5d9'
  on-surface-variant: '#bacbb9'
  inverse-surface: '#dbe5d9'
  inverse-on-surface: '#29332a'
  outline: '#859585'
  outline-variant: '#3b4a3d'
  surface-tint: '#00e475'
  primary: '#75ff9e'
  on-primary: '#003918'
  primary-container: '#00e676'
  on-primary-container: '#00612e'
  inverse-primary: '#006d35'
  secondary: '#b0c6ff'
  on-secondary: '#002d6e'
  secondary-container: '#0068ed'
  on-secondary-container: '#f2f3ff'
  tertiary: '#ffdec4'
  on-tertiary: '#4b2800'
  tertiary-container: '#ffba79'
  on-tertiary-container: '#794810'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62ff96'
  primary-fixed-dim: '#00e475'
  on-primary-fixed: '#00210b'
  on-primary-fixed-variant: '#005226'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429b'
  tertiary-fixed: '#ffdcbf'
  tertiary-fixed-dim: '#fdb878'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3c03'
  background: '#0d150e'
  on-background: '#dbe5d9'
  surface-variant: '#2e372e'
typography:
  display-profit:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

This design system is engineered for the high-stakes environment of professional reselling. The brand personality is authoritative, surgical, and ultra-fast. It positions the product as a competitive edge—a high-performance tool rather than just an app.

The aesthetic follows a **High-Contrast Glassmorphic** style. It utilizes deep, near-black surfaces to eliminate visual noise, allowing critical profit data and product images to emerge with extreme clarity. Translucent layers and subtle glows evoke a futuristic, AI-driven cockpit, while the rigid grid ensures reliability and trust during rapid-fire decision-making in retail environments.

## Colors

The palette is rooted in a "Signal vs. Noise" philosophy. The deep charcoal background minimizes eye strain and screen glare in various lighting conditions. 

- **Profit Green** is reserved exclusively for "Buy" verdicts and positive ROI metrics.
- **Data Blue** identifies interactive analytical elements and historical trends.
- **Warning Orange** and **Danger Red** provide instant cognitive shortcuts for "Maybe" and "Pass" decisions.
- **Surface Tints**: Use varying opacities of white (5% to 12%) over the background to create container levels, rather than introducing new gray hues.

## Typography

This design system uses a dual-font strategy to balance character with utility. **Space Grotesk** provides a technical, geometric edge for headlines and massive financial figures, emphasizing the "AI" nature of the product. **Inter** is used for all functional UI elements and body copy to ensure maximum legibility at small sizes during mobile use.

Numerical data representing profit and margins should always utilize the **display-profit** or **label-bold** styles to ensure they are the first thing a user sees upon scanning an item.

## Layout & Spacing

The layout is optimized for one-handed navigation, focusing on the "Thumb Zone." All critical actions, including the Scan button and primary navigation, are anchored to the bottom third of the screen.

A **4px base unit** governs the spacing scale. The layout uses a fluid grid with a fixed **20px outer margin** to ensure content does not bleed into the bezel of modern mobile devices. Large vertical gaps are used to separate distinct data clusters (e.g., separating "Amazon Comps" from "eBay Comps") to prevent information overload.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and light-based hierarchy rather than traditional shadows.

1.  **Base Layer:** The solid #121212 background.
2.  **Mid Layer (Cards):** Semi-transparent surfaces (White @ 8% opacity) with a 20px background blur (backdrop-filter) and a subtle 1px inner stroke (White @ 10%) to define edges.
3.  **Top Layer (Modals/Buttons):** Higher opacity fills with "Profit Green" or "Data Blue" outer glows (15px spread, 20% opacity) to simulate light emission.

This stacking creates a sense of hardware-accelerated performance and visual richness without clutter.

## Shapes

The shape language is "Sophisticated-Organic." While the grid is rigid, the elements utilize a **16px (rounded-lg)** standard corner radius. This softens the high-contrast color palette and makes the app feel premium and modern. 

The primary **Scan Button** is a perfect circle or a pill-shape to distinguish it from the rectangular data cards, acting as a clear physical metaphor for a "trigger" or "lens."

## Components

### Buttons
- **Primary (Scan):** Large, floating action button. High-saturation Profit Green with a subtle centered glow.
- **Secondary (Action):** Glassmorphic background with a 1px Data Blue border.
- **Verdict Buttons:** Full-width, high-saturation buttons in Green (Buy), Orange (Maybe), or Red (Pass).

### Cards
- **Product Card:** Features a background blur effect. Information is segmented by 1px horizontal dividers (White @ 5%).
- **Metric Card:** Small, square modules that highlight a single data point (e.g., "Sales Rank") with a large numerical display.

### Data Visualization
- **Trend Lines:** Minimalist, 2px stroke width sparks. Use "Profit Green" for upward trends and "Danger Red" for downward trends. No axes or labels are shown in the summary view to maintain a clean aesthetic.

### Inputs
- **Search/Scan Input:** Deep black fill (#000000) with a Data Blue focus ring. Icons should be simplified line art with a 2px stroke.

### Feedback Chips
- Small, pill-shaped tags used for "Category," "Condition," or "Source." These should have a low-opacity fill of the category color and high-opacity text.