# Sessionably Theme Color Palettes

## Theme 1 - Red/Orange Accent
- Primary Color: #E85D4F (red/orange)
- Background: #FFFFFF (white content areas)
- Body Background: #e5e5e5 (light grey)
- Text: #000000 (black)
- Use case: Bold, energetic medical brand

## Theme 2 - Blue Accent
- Primary Color: #3498db (blue)
- Background: #FFFFFF (white content areas)
- Body Background: #e5e5e5 (light grey)
- Text: #000000 (black)
- Use case: Professional, trustworthy medical brand

## Theme 3 - Green Accent (Current)
- Primary Color: #00a86b (green)
- Background: #FFFFFF (white content areas)
- Body Background: #e5e5e5 (light grey)
- Text: #000000 (black)
- Use case: Health-focused, calming medical brand

## Implementation Notes

To switch themes, update the CSS variables in `index.html`:

```css
:root {
    --primary-color: [THEME_COLOR];
    --primary-hover: [DARKER_THEME_COLOR];
    --background-gradient: #e5e5e5;
    --surface-color: #ffffff;
    --text-primary: #000000;
}
```

### Theme Color Variations:
- **Red/Orange**: Primary #E85D4F, Hover #D35400
- **Blue**: Primary #3498db, Hover #2980b9
- **Green**: Primary #00a86b, Hover #008f5a

All themes maintain:
- Light grey background (#e5e5e5)
- White content surfaces (#ffffff)
- Black text (#000000)
- Consistent shadow and border styling
