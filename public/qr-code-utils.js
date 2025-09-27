/**
 * QR Code Utility Functions
 * Handles QR code generation with multiple fallback mechanisms
 */

class QRCodeUtils {
    constructor() {
        this.isLibraryLoaded = false;
        this.fallbackMode = false;
        this.init();
    }

    async init() {
        await this.waitForQRCodeLibrary();
    }

    async waitForQRCodeLibrary() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (typeof QRCode === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not loaded, using fallback');
            this.loadQRCodeLibraryAlternative();
        } else {
            console.log('✅ QRCode library loaded successfully');
            this.isLibraryLoaded = true;
        }
    }

    loadQRCodeLibraryAlternative() {
        // Try multiple CDNs in sequence
        const cdns = [
            'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
            'https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.3/qrcode.min.js'
        ];
        
        let currentIndex = 0;
        
        const tryNextCDN = () => {
            if (currentIndex >= cdns.length) {
                console.warn('❌ All CDNs failed, trying local fallback');
                this.loadLocalQRCodeLibrary();
                return;
            }
            
            const script = document.createElement('script');
            script.src = cdns[currentIndex];
            script.onload = () => {
                console.log(`✅ QRCode library loaded from CDN ${currentIndex + 1}`);
                this.isLibraryLoaded = true;
                this.fallbackMode = false;
            };
            script.onerror = () => {
                console.warn(`❌ Failed to load QRCode library from CDN ${currentIndex + 1}`);
                currentIndex++;
                tryNextCDN();
            };
            document.head.appendChild(script);
        };
        
        tryNextCDN();
    }

    loadLocalQRCodeLibrary() {
        // Try to load local QR code library
        const script = document.createElement('script');
        script.src = 'qrcode.min.js';
        script.onload = () => {
            console.log('✅ Local QRCode library loaded');
            this.isLibraryLoaded = true;
            this.fallbackMode = false;
        };
        script.onerror = () => {
            console.warn('❌ Local QRCode library failed, using basic fallback');
            this.initializeFallback();
        };
        document.head.appendChild(script);
    }

    initializeFallback() {
        this.fallbackMode = true;
        // Use a complete fallback
        window.QRCode = {
            toDataURL: (text, options, callback) => {
                if (callback) {
                    callback(null, this.generateFallbackQRCode(text));
                }
            },
            toCanvas: (canvas, text, options, callback) => {
                if (callback) {
                    this.generateFallbackQRCodeCanvas(canvas, text);
                    callback(null);
                }
            }
        };
        console.log('✅ QRCode fallback initialized');
    }

    generateFallbackQRCode(text) {
        // Generate a simple SVG-based QR code representation
        const truncatedText = text.length > 20 ? text.substring(0, 20) + '...' : text;
        
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                <defs>
                    <pattern id="qrPattern" patternUnits="userSpaceOnUse" width="10" height="10">
                        <rect width="10" height="10" fill="white"/>
                        <rect width="5" height="5" fill="black"/>
                        <rect x="5" y="5" width="5" height="5" fill="black"/>
                    </pattern>
                </defs>
                <rect width="200" height="200" fill="white" stroke="black" stroke-width="2"/>
                <rect x="20" y="20" width="160" height="160" fill="url(#qrPattern)" opacity="0.3"/>
                <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">QR Code</text>
                <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="8" fill="black">${truncatedText}</text>
                <text x="100" y="140" text-anchor="middle" font-family="monospace" font-size="6" fill="gray">Fallback Mode</text>
            </svg>
        `;
        
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    generateFallbackQRCodeCanvas(canvas, text) {
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 200, 200);
        
        // Draw border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 200, 200);
        
        // Draw QR pattern simulation
        ctx.fillStyle = 'black';
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                if ((i + j) % 3 === 0) {
                    ctx.fillRect(10 + i * 8, 10 + j * 8, 6, 6);
                }
            }
        }
        
        // Draw text
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', 100, 100);
        
        ctx.font = '8px monospace';
        const truncatedText = text.length > 20 ? text.substring(0, 20) + '...' : text;
        ctx.fillText(truncatedText, 100, 120);
        
        ctx.font = '6px monospace';
        ctx.fillStyle = 'gray';
        ctx.fillText('Fallback Mode', 100, 140);
    }

    async generateQRCode(text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!window.QRCode) {
                reject(new Error('QRCode library not available'));
                return;
            }

            const defaultOptions = {
                width: 200,
                height: 200,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M',
                margin: 2
            };

            const finalOptions = { ...defaultOptions, ...options };

            window.QRCode.toDataURL(text, finalOptions, (error, url) => {
                if (error) {
                    console.error('QR Code generation failed:', error);
                    reject(error);
                } else {
                    resolve(url);
                }
            });
        });
    }

    async generateQRCodeToCanvas(canvas, text, options = {}) {
        return new Promise((resolve, reject) => {
            if (!window.QRCode) {
                reject(new Error('QRCode library not available'));
                return;
            }

            const defaultOptions = {
                width: 200,
                height: 200,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M',
                margin: 2
            };

            const finalOptions = { ...defaultOptions, ...options };

            window.QRCode.toCanvas(canvas, text, finalOptions, (error) => {
                if (error) {
                    console.error('QR Code generation failed:', error);
                    reject(error);
                } else {
                    resolve(canvas);
                }
            });
        });
    }

    generateCertificateQRCode(certificateData) {
        const qrData = {
            certificateId: certificateData.certificateId,
            studentName: certificateData.studentName,
            courseName: certificateData.courseName,
            issueDate: certificateData.issueDate,
            blockchainHash: certificateData.blockchainHash,
            verificationUrl: `${window.location.origin}/verify?certificateId=${certificateData.certificateId}`
        };

        return JSON.stringify(qrData);
    }

    async generateCertificateQRCodeImage(certificateData, options = {}) {
        try {
            const qrText = this.generateCertificateQRCode(certificateData);
            return await this.generateQRCode(qrText, options);
        } catch (error) {
            console.error('Certificate QR Code generation failed:', error);
            // Return fallback QR code
            return this.generateFallbackQRCode(qrText);
        }
    }

    async generateCertificateQRCodeCanvas(canvas, certificateData, options = {}) {
        try {
            const qrText = this.generateCertificateQRCode(certificateData);
            return await this.generateQRCodeToCanvas(canvas, qrText, options);
        } catch (error) {
            console.error('Certificate QR Code generation failed:', error);
            // Generate fallback QR code
            this.generateFallbackQRCodeCanvas(canvas, qrText);
            return canvas;
        }
    }

    // Utility method to check if QR code library is loaded
    isQRCodeLibraryLoaded() {
        return this.isLibraryLoaded && typeof QRCode !== 'undefined';
    }

    // Utility method to check if in fallback mode
    isInFallbackMode() {
        return this.fallbackMode;
    }

    // Method to get QR code status
    getStatus() {
        return {
            libraryLoaded: this.isLibraryLoaded,
            fallbackMode: this.fallbackMode,
            qrCodeAvailable: typeof QRCode !== 'undefined'
        };
    }
}

// Create global instance
window.qrCodeUtils = new QRCodeUtils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QRCodeUtils;
}
