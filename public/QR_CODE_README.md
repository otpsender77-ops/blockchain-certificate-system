# QR Code Utility Documentation

## Overview
The QR Code Utility (`qr-code-utils.js`) provides a robust, fallback-enabled system for generating QR codes in the Blockchain Certificate System. It handles multiple scenarios including library loading failures and provides comprehensive fallback mechanisms.

## Features

### ✅ **Multiple Fallback Mechanisms**
- Primary: QRCode.js library from CDN
- Secondary: Alternative CDN loading
- Tertiary: Custom SVG-based fallback
- Quaternary: Canvas-based fallback

### ✅ **Certificate-Specific QR Codes**
- Generates QR codes with certificate metadata
- Includes verification URLs
- Supports blockchain hash integration
- JSON-structured data format

### ✅ **Cross-Browser Compatibility**
- Works with all modern browsers
- Safari-compatible fallbacks
- Mobile device support

## Usage

### Basic QR Code Generation
```javascript
// Wait for QR utils to load
await window.qrCodeUtils.init();

// Generate basic QR code
const canvas = document.getElementById('myCanvas');
await window.qrCodeUtils.generateQRCodeToCanvas(canvas, 'Hello World!', {
    width: 200,
    height: 200,
    color: {
        dark: '#000000',
        light: '#ffffff'
    }
});
```

### Certificate QR Code Generation
```javascript
const certificateData = {
    certificateId: 'DEIT20250001',
    studentName: 'John Doe',
    courseName: 'Blockchain Technology',
    issueDate: '2025-01-01',
    blockchainHash: '0x1234567890abcdef'
};

const canvas = document.getElementById('certificateQR');
await window.qrCodeUtils.generateCertificateQRCodeCanvas(canvas, certificateData, {
    width: 200,
    height: 200,
    color: {
        dark: '#1e40af',
        light: '#ffffff'
    }
});
```

### Data URL Generation
```javascript
const qrDataURL = await window.qrCodeUtils.generateQRCode('Hello World!', {
    width: 200,
    height: 200
});
// Returns: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
```

## API Reference

### Methods

#### `init()`
Initializes the QR code utility and loads the library.
```javascript
await window.qrCodeUtils.init();
```

#### `generateQRCode(text, options)`
Generates a QR code as a data URL.
- **text**: String to encode
- **options**: Configuration object
- **Returns**: Promise resolving to data URL string

#### `generateQRCodeToCanvas(canvas, text, options)`
Generates a QR code on a canvas element.
- **canvas**: HTMLCanvasElement
- **text**: String to encode
- **options**: Configuration object
- **Returns**: Promise resolving to canvas element

#### `generateCertificateQRCode(certificateData)`
Generates QR code data for a certificate.
- **certificateData**: Object with certificate information
- **Returns**: JSON string for QR code

#### `generateCertificateQRCodeImage(certificateData, options)`
Generates a certificate QR code as a data URL.
- **certificateData**: Object with certificate information
- **options**: Configuration object
- **Returns**: Promise resolving to data URL string

#### `generateCertificateQRCodeCanvas(canvas, certificateData, options)`
Generates a certificate QR code on a canvas element.
- **canvas**: HTMLCanvasElement
- **certificateData**: Object with certificate information
- **options**: Configuration object
- **Returns**: Promise resolving to canvas element

### Utility Methods

#### `isQRCodeLibraryLoaded()`
Checks if the QR code library is loaded.
- **Returns**: Boolean

#### `isInFallbackMode()`
Checks if the utility is running in fallback mode.
- **Returns**: Boolean

#### `getStatus()`
Gets the current status of the QR code utility.
- **Returns**: Object with status information

## Configuration Options

### QR Code Options
```javascript
const options = {
    width: 200,                    // QR code width
    height: 200,                   // QR code height
    color: {
        dark: '#000000',          // Dark color (foreground)
        light: '#ffffff'          // Light color (background)
    },
    errorCorrectionLevel: 'M',     // Error correction level (L, M, Q, H)
    margin: 2                      // Margin around QR code
};
```

### Certificate Data Structure
```javascript
const certificateData = {
    certificateId: 'DEIT20250001',           // Unique certificate ID
    studentName: 'John Doe',                 // Student name
    courseName: 'Blockchain Technology',     // Course name
    issueDate: '2025-01-01',                // Issue date (ISO format)
    blockchainHash: '0x1234567890abcdef'     // Blockchain transaction hash
};
```

## Fallback Behavior

### 1. Primary Mode (QRCode.js Library)
- Uses the official QRCode.js library
- Full feature support
- High-quality QR codes

### 2. Fallback Mode (Custom Implementation)
- SVG-based QR code representation
- Canvas-based drawing
- Basic functionality maintained
- Visual indication of fallback mode

## Error Handling

The utility includes comprehensive error handling:

```javascript
try {
    await window.qrCodeUtils.generateQRCode('Hello World!');
} catch (error) {
    console.error('QR Code generation failed:', error);
    // Fallback handling
}
```

## Testing

A test page is available at `/qr-test.html` to verify QR code functionality:

1. **Basic QR Code Test**: Tests simple text encoding
2. **Certificate QR Code Test**: Tests certificate-specific QR codes
3. **Multiple QR Codes Test**: Tests batch generation
4. **Status Display**: Shows current utility status

## Integration

### HTML Integration
```html
<!-- Load QR code libraries -->
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js" defer></script>
<script src="qr-code-utils.js" defer></script>

<!-- Canvas element for QR code -->
<canvas id="qrCode" width="200" height="200"></canvas>
```

### JavaScript Integration
```javascript
// Wait for utilities to load
document.addEventListener('DOMContentLoaded', async () => {
    await window.qrCodeUtils.init();
    
    // Generate QR code
    const canvas = document.getElementById('qrCode');
    await window.qrCodeUtils.generateQRCodeToCanvas(canvas, 'Hello World!');
});
```

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Library Loading**: ~50ms (cached)
- **QR Code Generation**: ~10-50ms (depending on complexity)
- **Fallback Mode**: ~5-10ms
- **Memory Usage**: Minimal (canvas-based)

## Security

- **CSP Compatible**: Works with Content Security Policy
- **No External Dependencies**: Fallback mode is self-contained
- **Safe Data Handling**: No sensitive data exposure

## Troubleshooting

### Common Issues

1. **QR Code Library Not Loading**
   - Check internet connection
   - Verify CSP settings
   - Check browser console for errors

2. **Canvas Not Rendering**
   - Ensure canvas element exists
   - Check canvas dimensions
   - Verify JavaScript execution

3. **Fallback Mode Issues**
   - Check browser compatibility
   - Verify canvas support
   - Check for JavaScript errors

### Debug Mode
```javascript
// Enable debug logging
console.log('QR Utils Status:', window.qrCodeUtils.getStatus());
```

## License

This utility is part of the Digital Excellence Institute Certificate System and follows the same licensing terms.
