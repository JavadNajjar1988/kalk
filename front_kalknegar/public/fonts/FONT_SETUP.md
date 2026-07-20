# B-Yekan Font Setup Documentation

## Overview
This document describes the B-Yekan font setup for the ORBAT project. The configuration ensures proper Persian/Farsi text display with appropriate fallbacks across both Frontend and Backend applications.

## ✅ Unified Font Configuration

### Primary Font: B-Yekan
- **Family Name**: 'B-Yekan' (unified across all applications)
- **Weights**: 400 (Regular), 700 (Bold)
- **Format**: WOFF2, WOFF
- **Unicode Range**: Persian/Arabic characters (U+0600-06FF, etc.)

### Fallback Chain (Standardized)
1. **B-Yekan** (Local installation if available)
2. **Vazirmatn** (Google Fonts)
3. **Tahoma** (Windows system font with Persian support)
4. **Iranian Sans** (If available)
5. **بی یکان** (Persian local name)
6. **تهوما** (Persian local name)
7. **Segoe UI** (Modern system font)
8. **Arial** (Universal fallback)

### File Structure
```
public/fonts/
├── Yekan.woff2          # B-Yekan Regular (WOFF2) - ✅ Real files
├── Yekan.woff           # B-Yekan Regular (WOFF) - ✅ Real files
├── Yekan-Bold.woff2     # B-Yekan Bold (WOFF2) - ✅ Real files
├── Yekan-Bold.woff      # B-Yekan Bold (WOFF) - ✅ Real files
├── README.md            # Font directory documentation
└── FONT_SETUP.md        # This file
```

## ✅ Updated Files and Components

### Frontend Application (`frontend/`)
- **Theme Configuration**: `src/theme/index.ts` - ✅ Updated to B-Yekan
- **Main CSS**: `src/index.css` - ✅ Updated font-face and body font
- **Tailwind Config**: `tailwind.config.js` - ✅ Added B-Yekan to font stack
- **PDF Generator**: `src/modules/dashboard/pages/users/utils/pdf-generator.ts` - ✅ Updated
- **Graph Components**: `src/modules/definition-editor/pages/sections/GraphViewSection.css` - ✅ Updated
- **Font Files**: `public/fonts/` - ✅ Real B-Yekan font files

### Backend Application (`backend/orbat/Orbat/`)
- **Main CSS**: `src/styles.css` - ✅ Updated with unified B-Yekan configuration
- **Day.js Config**: `src/dayjs.ts` - ✅ Added Jalali plugin extension
- **Font Files**: `public/fonts/` - ✅ Real B-Yekan font files (copied from frontend)

### Test Files
- **Integration Test**: `test-integration.html` - ✅ Updated font
- **Debug Integration**: `debug-vue-integration.html` - ✅ Updated font

### CSS Implementation
The font configuration is implemented in multiple locations:

1. **@import statements** for Google Fonts (Vazirmatn)
2. **@font-face declarations** for B-Yekan with local() and url() sources
3. **Theme configuration** with unified font stack
4. **Body element** with explicit font-family and RTL direction
5. **Component-specific font declarations** (Material-UI, CSS modules)
6. **PDF generation font stack**

## Unified Font Stack
```css
font-family: 'B-Yekan', 'Vazirmatn', 'Tahoma', 'Iranian Sans', 'بی یکان', 'تهوما', 'Segoe UI', 'Arial', sans-serif;
```

## Features

### RTL Support
- `direction: rtl` on body element
- `text-align: right` for proper Persian text alignment
- Unicode ranges for Persian/Arabic character support

### Performance Optimizations
- `font-display: swap` for better loading performance
- Local font detection before downloading
- WOFF2 format prioritized for smaller file sizes
- Unicode range limitations for targeted loading

### Error Handling
- Multiple fallback fonts in order of preference
- Local font detection prevents unnecessary downloads
- Graceful degradation to system fonts

## Font Replacement Instructions

To replace the placeholder font files with actual B-Yekan fonts:

1. **Download B-Yekan fonts** from:
   - [Behdad Esfahbod's repository](https://github.com/rastikerdar/yekan)
   - [Font libraries](https://fontlibrary.org/)
   - Local font collections

2. **Replace placeholder files**:
   ```bash
   # Navigate to fonts directory
   cd public/fonts/
   
   # Replace with actual font files
   cp /path/to/actual/Yekan.woff2 ./Yekan.woff2
   cp /path/to/actual/Yekan.woff ./Yekan.woff
   cp /path/to/actual/Yekan-Bold.woff2 ./Yekan-Bold.woff2
   cp /path/to/actual/Yekan-Bold.woff ./Yekan-Bold.woff
   ```

3. **Verify font loading** in browser developer tools

## Browser Support

- **WOFF2**: Modern browsers (Chrome 36+, Firefox 39+, Safari 12+)
- **WOFF**: Legacy browser support (IE 9+, older mobile browsers)
- **Fallbacks**: Universal compatibility with system fonts

## Testing

To test font loading:

1. Open browser developer tools
2. Go to Network tab
3. Filter by \"Font\" or \"All\"
4. Reload the page
5. Check if font files are loaded or fallbacks are used

## Troubleshooting

### Font Not Loading
1. Check if font files exist in `public/fonts/`
2. Verify file permissions
3. Check browser console for font loading errors
4. Ensure proper MIME types are served by the server

### Incorrect Font Display
1. Verify CSS font-family stack
2. Check if local fonts are interfering
3. Clear browser cache
4. Test with different fallback fonts

## Related Files

- `src/styles.css` - Main font configuration
- `public/fonts/` - Font files directory
- `src/dayjs.ts` - Date formatting with Jalali support
- Persian translation files in frontend

---

**Note**: Current setup uses placeholder files. Replace with actual B-Yekan font files for production use.