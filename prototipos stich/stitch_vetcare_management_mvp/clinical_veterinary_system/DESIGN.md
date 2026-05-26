---
name: Clinical Veterinary System
colors:
  surface: '#f3faff'
  surface-dim: '#c7dde9'
  surface-bright: '#f3faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e6f6ff'
  surface-container: '#dbf1fe'
  surface-container-high: '#d5ecf8'
  surface-container-highest: '#cfe6f2'
  on-surface: '#071e27'
  on-surface-variant: '#434653'
  inverse-surface: '#1e333c'
  inverse-on-surface: '#dff4ff'
  outline: '#737784'
  outline-variant: '#c3c6d5'
  surface-tint: '#1d59c1'
  primary: '#003c90'
  on-primary: '#ffffff'
  primary-container: '#0f52ba'
  on-primary-container: '#bcceff'
  inverse-primary: '#b0c6ff'
  secondary: '#006e1c'
  on-secondary: '#ffffff'
  secondary-container: '#91f78e'
  on-secondary-container: '#00731e'
  tertiary: '#613600'
  on-tertiary: '#ffffff'
  tertiary-container: '#814b00'
  on-tertiary-container: '#ffc388'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001945'
  on-primary-fixed-variant: '#00419c'
  secondary-fixed: '#94f990'
  secondary-fixed-dim: '#78dc77'
  on-secondary-fixed: '#002204'
  on-secondary-fixed-variant: '#005313'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb870'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#f3faff'
  on-background: '#071e27'
  surface-variant: '#cfe6f2'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for professional veterinary environments, prioritizing clinical precision, speed of information retrieval, and an underlying sense of calm. The target audience includes veterinary surgeons, technicians, and reception staff who require high-density data management without cognitive overload.

The aesthetic follows a **Modern Corporate Minimalism**. It utilizes generous whitespace to reduce visual noise in high-stress clinical situations. The interface feels "medical" but remains approachable through soft geometry and a balanced use of color-coded status indicators. Every element is designed to feel stable and reliable, reflecting the professional integrity of a medical facility.

## Colors

The palette is anchored by **Clinical Blue**, representing authority and hygiene. It is complemented by **Health Green** for positive outcomes and active states. 

- **Primary (Clinical Blue):** Used for main actions, navigation, and "Confirmed" appointment states.
- **Secondary (Soft Green):** Reserved for "Attended" states and health-related confirmations.
- **Alert & Emergency (Orange/Red):** High-visibility tones for critical patient data and "Emergency" status.
- **Neutrals:** A range of cool grays (Slate/Blue-Gray) to maintain a sterile, professional environment without the harshness of pure black.
- **Status Mapping:**
    - Pending: Medium Gray (#94A3B8)
    - Confirmado: Clinical Blue (#0F52BA)
    - Atendido: Soft Green (#4CAF50)
    - Cancelado: Standard Red (#EF4444)
    - Emergencia: Deep Red (#B91C1C) with pulsed animation.

## Typography

This design system utilizes **Inter** exclusively to ensure maximum legibility across different resolutions, particularly on tablets used in clinical areas. 

The typographic hierarchy is highly structured. Headlines use tighter letter spacing and heavier weights for immediate identification of patient names and record sections. Body text maintains standard tracking for readability in long-form medical notes. Labels are used for metadata and status badges, often employing all-caps to distinguish them from editable data fields.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid Grid**. On desktop (Reception), a 12-column grid is used to allow for a multi-pane view (e.g., Calendar + Patient Sidebar). On tablet (Clinic), the layout shifts to a simplified 6-column grid or single-column stack to facilitate touch interactions.

- **Spacing Rhythm:** An 8px linear scale ensures consistent vertical rhythm.
- **Form Layout:** All clinical and intake forms must follow a **single-column model**. This prevents visual scanning errors and ensures data validation is clear and sequential, which is critical for medical accuracy.
- **Touch Targets:** For the tablet breakpoint, all interactive elements (buttons, inputs) must maintain a minimum height of 48px to accommodate glove-friendly interactions.

## Elevation & Depth

To maintain a clean, clinical look, this design system avoids heavy shadows. Hierarchy is established through **Tonal Layering** and **Subtle Ambient Shadows**.

1.  **Level 0 (Background):** The base canvas uses a very light cool gray (#F8FAFC) to reduce eye strain.
2.  **Level 1 (Cards/Containers):** Patient records and modules are placed on pure white surfaces with a 1px border (#E2E8F0) and a very soft, diffused shadow (0px 2px 4px rgba(0,0,0,0.05)).
3.  **Level 2 (Modals/Popovers):** Used for drug dosage calculators or emergency alerts. These use a slightly more pronounced shadow (0px 10px 15px rgba(0,0,0,0.1)) and a background backdrop blur of 4px to maintain focus.

## Shapes

The design system uses a **Soft (0.25rem)** rounding strategy. This provides a modern, friendly feel that softens the "cold" clinical environment while maintaining a professional, structured appearance.

- **Small Components:** Checkboxes and small buttons use a 4px (0.25rem) radius.
- **Cards & Sections:** Larger containers use 8px (0.5rem) to clearly define content groupings.
- **Status Badges:** These use a full-pill radius (rounded-full) to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons use a solid Clinical Blue background with white text. Secondary actions use a ghost style with a blue outline. Emergency buttons use a solid Deep Red.
- **Status Chips:** Small, non-interactive indicators for appointment states. The "Emergencia" chip features a 2-second opacity pulse animation (100% to 70%) to draw immediate attention.
- **Input Fields:** Minimalist design with a 1px border. On focus, the border transitions to Clinical Blue with a soft 2px glow. Errors are highlighted with a red border and supporting text below the field.
- **Cards:** Used to encapsulate patient information. Header sections of cards should include the species icon (e.g., dog, cat, exotic) and the current status chip in the top-right corner.
- **Lists:** Data-heavy lists (like medical history) use alternating row highlights or subtle dividers to prevent horizontal reading errors.
- **Forms:** Always single-column. Group related fields (e.g., "Owner Information") using subtle fieldset dividers or header labels.