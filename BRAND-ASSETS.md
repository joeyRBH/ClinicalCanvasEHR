# ClinicalCanvas Brand Assets & Design System

## Overview
This document contains the complete branding specifications for ClinicalCanvas EHR, including logos, icons, color palette, and implementation guidelines.

**Version**: 1.0
**Date**: November 2025
**Created for**: ClinicalCanvas EHR - Behavioral Health Practice Management System

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#2563eb` - Used for primary UI elements, buttons, and main branding
- **Accent Green**: `#10b981` - Used for success states, health indicators, and accent elements
- **Dark Text**: `#1e293b` - Primary text color
- **Secondary Text**: `#64748b` - Secondary text, labels, and subtle information
- **Background**: `#f1f5f9` - Light background color

### Light Theme Variants
- **Light Blue**: `#60a5fa` - For hover states and lighter variations
- **Light Green**: `#34d399` - For lighter accent states

### CSS Variables
The color palette is available through CSS variables in `fortune-bright-theme.css`:

```css
:root {
    /* ClinicalCanvas Brand Colors */
    --primary-blue: #2563eb;
    --light-blue: #60a5fa;
    --accent-green: #10b981;
    --light-green: #34d399;
    --dark-text: #1e293b;
    --secondary-text: #64748b;
    --background-light: #f1f5f9;

    /* Standard theme variables */
    --primary-color: #2563eb;
    --primary-hover: #60a5fa;
    --accent-color: #10b981;
    --success-color: #10b981;
}
```

---

## Logo Assets

### Main Logo Files
All logo files are located in `/public/assets/logos/`

#### 1. Full Logo (Light Background)
**File**: `clinicalcanvas-logo.svg`
**Dimensions**: 300x80px
**Usage**: Headers, login pages, light backgrounds

Features:
- Canvas frame in primary blue (#2563eb)
- Pulse line in accent green (#10b981)
- Medical cross accent
- Dark text (#1e293b) for "ClinicalCanvas"
- Secondary text (#64748b) for tagline

#### 2. Full Logo (Dark Background)
**File**: `clinicalcanvas-logo-dark.svg`
**Dimensions**: 300x80px
**Usage**: Dark mode interfaces, dark backgrounds

Features:
- Canvas frame in light blue (#60a5fa)
- Pulse line in light green (#34d399)
- Light text (#f1f5f9) for "ClinicalCanvas"

#### 3. Symbol Only (Favicon/Icon)
**File**: `clinicalcanvas-icon.svg` or `/icon.svg` (root)
**Dimensions**: 80x80px (scalable), 512x512px (root icon)
**Usage**: Favicons, mobile app icons, compact spaces

Features:
- Square canvas frame with pulse line
- Medical cross in circle
- Scales well at all sizes

---

## Navigation Icons

All navigation icons are located in `/public/assets/icons/`

### Icon Specifications
- **Size**: 60x60px (designed to scale to 24-48px)
- **Stroke Width**: 3px for primary elements, 2-2.5px for secondary
- **Colors**: Primary blue (#2563eb) with accent green (#10b981) highlights
- **Style**: Outlined, modern, consistent

### Available Icons

1. **Dashboard** - `icon-dashboard.svg`
   - Grid layout with 4 squares

2. **Clients** - `icon-clients.svg`
   - User profile with circle and body outline

3. **Appointments** - `icon-appointments.svg`
   - Calendar with date markers
   - Green dot for active appointments

4. **Clinical Notes** - `icon-notes.svg`
   - Document with folded corner
   - Green highlight on first line

5. **Billing** - `icon-billing.svg`
   - Credit card with $$ symbol

6. **Documents** - `icon-documents.svg`
   - Document with multiple lines
   - Green accent line

7. **Reports/Analytics** - `icon-reports.svg`
   - Bar chart with rising bars
   - Green middle bar (highest)

8. **Settings** - `icon-settings.svg`
   - Gear/cog with 8 spokes

9. **Messages** - `icon-messages.svg`
   - Envelope with green accent

10. **Treatment Plans** - `icon-treatment-plans.svg`
    - Checklist with green checkmark

11. **Insurance** - `icon-insurance.svg`
    - Shield with green checkmark

12. **User Profile** - `icon-user.svg`
    - User avatar outline

---

## Design Philosophy

### Visual Language
- **Professional Medical**: Blue primary color conveys trust and professionalism
- **Health & Wellness**: Green accents represent health, vitality, and positive outcomes
- **Modern & Clean**: Outlined icons with consistent stroke widths
- **Accessible**: High contrast ratios for text and UI elements

### Icon Design Principles
1. **Consistency**: All icons use 3px stroke width for primary elements
2. **Scalability**: SVG format ensures perfect rendering at any size
3. **Color Strategy**: Blue primary with green accents for active/success states
4. **Rounded Corners**: Soft, approachable aesthetic with stroke-linecap: round

---

## Implementation Guidelines

### Using Logos in HTML

```html
<!-- Light background (default) -->
<img src="/public/assets/logos/clinicalcanvas-logo.svg"
     alt="ClinicalCanvas"
     class="logo"
     style="height: 40px;">

<!-- Dark background -->
<img src="/public/assets/logos/clinicalcanvas-logo-dark.svg"
     alt="ClinicalCanvas"
     class="logo-dark"
     style="height: 40px;">

<!-- Favicon (in <head>) -->
<link rel="icon" href="/icon.svg" type="image/svg+xml">
```

### Using Navigation Icons

```html
<!-- Inline SVG (recommended for color customization) -->
<div class="nav-item">
    <svg width="24" height="24" viewBox="0 0 60 60">
        <!-- Icon SVG content -->
    </svg>
    <span>Dashboard</span>
</div>

<!-- Or as image -->
<img src="/public/assets/icons/icon-dashboard.svg"
     alt="Dashboard"
     width="24"
     height="24">
```

### CSS Icon Styling

```css
.nav-icon {
    width: 24px;
    height: 24px;
    color: var(--primary-blue);
    transition: color 0.2s ease;
}

.nav-icon:hover {
    color: var(--light-blue);
}

.nav-icon.active {
    color: var(--accent-green);
}
```

### JavaScript Icon Integration

```javascript
// Icon library object
const icons = {
    dashboard: '/public/assets/icons/icon-dashboard.svg',
    clients: '/public/assets/icons/icon-clients.svg',
    appointments: '/public/assets/icons/icon-appointments.svg',
    // ... other icons
};

// Dynamic icon loading
function loadIcon(iconName) {
    return `<img src="${icons[iconName]}" alt="${iconName}" class="nav-icon">`;
}
```

---

## Typography

### Font Stack
```css
/* Body text */
--fortune-body-font: 'Karla', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Headings */
--fortune-heading-font: 'Open Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Weights
- **Logo**: 700 (Bold) for "ClinicalCanvas"
- **Tagline**: 400 (Regular) for "BEHAVIORAL HEALTH EHR"
- **Headings**: 600-700
- **Body**: 400-500

### Logo Text Styling
```css
.logo-text {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--dark-text);
}

.logo-tagline {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: var(--secondary-text);
    letter-spacing: 1px;
    text-transform: uppercase;
}
```

---

## Favicon Recommendations

### Required Formats
Convert the Symbol Only SVG (`/icon.svg`) to the following formats:

1. **favicon.ico** - Multi-resolution (16x16, 32x32, 48x48)
2. **apple-touch-icon.png** - 180x180px for iOS
3. **android-chrome-192.png** - 192x192px for Android
4. **android-chrome-512.png** - 512x512px for Android

### HTML Implementation
```html
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
```

---

## PWA Manifest Configuration

The app manifest (`manifest.json`) is configured with brand colors:

```json
{
  "name": "ClinicalCanvas",
  "short_name": "ClinicalCanvas",
  "description": "HIPAA-compliant clinical documentation platform",
  "background_color": "#2563eb",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

---

## Accessibility

### Color Contrast Ratios
- **Primary Blue (#2563eb) on White**: 7.2:1 (AAA)
- **Dark Text (#1e293b) on White**: 13.5:1 (AAA)
- **Secondary Text (#64748b) on White**: 4.6:1 (AA)
- **Accent Green (#10b981) on White**: 3.4:1 (AA Large)

### Icon Accessibility
- All icons include descriptive alt text
- Minimum touch target size: 44x44px
- Sufficient color contrast for icon states

---

## File Structure

```
ClinicalCanvasEHR/
├── icon.svg                           # Main favicon/app icon (512x512)
├── manifest.json                      # PWA manifest with brand colors
├── fortune-bright-theme.css           # Theme CSS with brand colors
├── public/
│   └── assets/
│       ├── logos/
│       │   ├── clinicalcanvas-logo.svg       # Full logo (light)
│       │   ├── clinicalcanvas-logo-dark.svg  # Full logo (dark)
│       │   └── clinicalcanvas-icon.svg       # Symbol only
│       └── icons/
│           ├── icon-dashboard.svg
│           ├── icon-clients.svg
│           ├── icon-appointments.svg
│           ├── icon-notes.svg
│           ├── icon-billing.svg
│           ├── icon-documents.svg
│           ├── icon-reports.svg
│           ├── icon-settings.svg
│           ├── icon-messages.svg
│           ├── icon-treatment-plans.svg
│           ├── icon-insurance.svg
│           └── icon-user.svg
```

---

## Usage Examples

### Hero Section with Logo
```html
<header class="hero">
    <img src="/public/assets/logos/clinicalcanvas-logo.svg"
         alt="ClinicalCanvas - Behavioral Health EHR"
         class="hero-logo">
    <h1>Welcome to ClinicalCanvas</h1>
</header>
```

### Navigation with Icons
```html
<nav class="sidebar">
    <a href="/dashboard" class="nav-item active">
        <img src="/public/assets/icons/icon-dashboard.svg" alt="">
        <span>Dashboard</span>
    </a>
    <a href="/clients" class="nav-item">
        <img src="/public/assets/icons/icon-clients.svg" alt="">
        <span>Clients</span>
    </a>
    <!-- More nav items -->
</nav>
```

### Button with Brand Colors
```html
<button class="btn-primary">
    Schedule Appointment
</button>

<style>
.btn-primary {
    background: var(--primary-blue);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
}

.btn-primary:hover {
    background: var(--light-blue);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
</style>
```

---

## Version History

### Version 1.0 (November 2025)
- Initial brand asset creation
- Primary blue (#2563eb) and accent green (#10b981) color palette
- Full logo suite (light, dark, symbol)
- Complete navigation icon set (12 icons)
- CSS variable integration
- PWA manifest configuration

---

## Contact & Support

For questions about brand usage or to request additional assets:
- Review this documentation
- Check `/fortune-bright-theme.css` for color variables
- Refer to existing implementations in `app.html`

---

## License & Usage Rights

These brand assets are proprietary to ClinicalCanvas EHR. Usage is restricted to:
- ClinicalCanvas application interfaces
- Official marketing materials
- Partner integrations (with approval)

Do not modify logo proportions, colors, or design elements without approval.
