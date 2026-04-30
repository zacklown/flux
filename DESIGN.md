---
name: Precision Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#adc7ff'
  on-secondary: '#002e68'
  secondary-container: '#4a8eff'
  on-secondary-container: '#00285b'
  tertiary: '#fff5de'
  on-tertiary: '#3b2f00'
  tertiary-container: '#fed639'
  on-tertiary-container: '#715d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffe179'
  tertiary-fixed-dim: '#eac324'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  code:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system is engineered for high-performance utility tools where focus, speed, and technical accuracy are paramount. The aesthetic follows a **Modern Corporate** direction with a distinct "Pro" lean, utilizing a dark-first interface to reduce eye strain during prolonged technical workflows. 

The brand personality is authoritative yet unobtrusive. It evokes a sense of "digital craftsmanship" through a meticulous balance of deep charcoal surfaces and high-energy electric accents. The visual language relies on technical precision—using thin borders, subtle luminosity, and crisp typography to create a workspace that feels like a high-end instrument rather than a generic application.

## Colors

The palette is anchored by a deep charcoal and "true black" foundation to provide maximum contrast for the functional elements. 

- **Primary Accent:** An electric Cyan/Teal (#00F0FF) used exclusively for primary calls to action, active states, and critical progress indicators.
- **Secondary Accent:** A deeper Electric Blue (#007BFF) used for interactive elements that require less visual weight than the primary action.
- **Neutral Scale:** Uses a strictly neutral charcoal spectrum. Avoid warm or cool grays to maintain a clinical, professional atmosphere.
- **Semantic Colors:** Error and Success states utilize highly saturated hues to pierce through the dark background, ensuring immediate user recognition of system status.

## Typography

This design system utilizes **Inter** for its exceptional readability in data-dense environments. The typographic scale is optimized for information hierarchy:

- **Headlines:** Use semi-bold weights with slight negative letter spacing to feel compact and modern.
- **Body:** The standard body size is 14px to allow for high information density without sacrificing legibility.
- **Labels:** Small, uppercase labels with increased letter-spacing are used for categorization and section headers within sidebars or utility panels.
- **Monospace:** Use a standard system monospace font for data values, coordinates, or file paths to emphasize the tool’s technical utility.

## Layout & Spacing

The system employs a **Fluid Grid** model designed to maximize screen real estate. The spacing rhythm is based on a **4px baseline grid**, ensuring all components align predictably.

- **Panels:** Utilize a multi-pane layout (Left Sidebar for Navigation, Right Sidebar for Inspector, Center for Workspace).
- **Margins & Gutters:** A consistent 16px gutter between UI panels creates clear separation without wasting space. 
- **Density:** Components should favor a "Compact" density setting, reducing vertical padding to 8px or 10px in lists and menus to display more data at once.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** rather than traditional heavy shadows.

- **Level 0 (Base):** Deep Charcoal (#0A0A0A) for the background.
- **Level 1 (Panels):** Surface Gray (#1A1A1A) with a 1px subtle border (#FFFFFF at 8% opacity).
- **Level 2 (Popovers/Modals):** Lighter Surface (#242424) with a soft, diffused ambient shadow (0px 8px 24px rgba(0,0,0,0.5)).
- **Interactive State:** Hovered elements should increase in brightness or gain a subtle inner glow (1px white at 5% opacity) to signify tactility.

## Shapes

The design system uses a **Soft** (Level 1) roundedness approach. This provides a professional, modern feel that isn't as aggressive as sharp corners, nor as "friendly" as pill shapes.

- **Standard Components:** 4px (0.25rem) corner radius for buttons, inputs, and checkboxes.
- **Containers:** 8px (0.5rem) corner radius for cards and main workspace panels.
- **Selection Indicators:** Use vertical 2px bars or subtle background fills rather than rounded capsules for navigation items.

## Components

- **Buttons:** Primary buttons use the electric teal background with black text for maximum contrast. Secondary buttons use a ghost style (border only) or a subtle gray fill.
- **Inputs & Controls:** Use a dark-fill background (#0F0F0F) with a subtle 1px border. On focus, the border transitions to the primary accent color with a soft 2px outer glow.
- **Sliders & Toggles:** Sliders should feature a thin track with a high-contrast thumb. Toggles (switches) use the primary accent for the "on" state and a dark gray for the "off" state.
- **File Upload Zones:** Designed with a dashed 1px border (#FFFFFF at 15% opacity). On drag-over, the entire zone should take on a subtle primary accent tint (5% opacity).
- **Data Lists:** Use alternating row stripes (zebra striping) at very low contrast increments or 1px horizontal dividers to maintain alignment in complex data sets.
- **Status Chips:** Small, condensed pills with a low-opacity background tint of the status color (e.g., 10% Green) and a solid text color for readability.