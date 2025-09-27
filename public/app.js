// Blockchain Certificate System - Main Application
class CertificateSystem {
    constructor() {
        this.currentUser = null;
        this.certificates = [];
        this.emailHistory = [];
        this.verificationLog = [];
        this.currentPage = 'loginPage';
        this.pendingEmailCertificate = null;
        this.currentViewingCertificate = null;
        this.apiBaseUrl = window.location.origin + '/api';
        this.authToken = localStorage.getItem('authToken');
        this.metaMaskConnected = false;
        this.metaMaskAddress = null;
        
        console.log('CertificateSystem constructor called');
        this.init();
    }

    async init() {
        console.log('Initializing Certificate System...');
        
        // Check if user is already logged in
        if (this.authToken) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.log('Token verification failed, logging out');
                this.logout();
            }
        }
        
        this.setupApplication();
    }

    setupApplication() {
        this.setupEventListeners();
        this.updateStats();
        this.renderNavigation();
        this.showPage('loginPage');
        
        // Initialize QR Code library check
        this.waitForQRCodeLibrary();
        
        // Initialize QR Scanner
        this.initializeQRScanner();
        
        // Initialize batch processing and revocation
        this.setupBatchProcessing();
        this.setupRevocation();
        
        // Initialize MetaMask
        this.initializeMetaMask();
        
        console.log('Certificate System initialized successfully');
    }

    // MetaMask Integration Methods
    initializeMetaMask() {
        // Check if MetaMask is installed
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask is installed');
            this.setupMetaMaskEventListeners();
        } else {
            console.log('MetaMask is not installed');
            this.showMetaMaskError('MetaMask is not installed. Please install MetaMask to access the admin dashboard.');
        }
    }

    setupMetaMaskEventListeners() {
        const connectBtn = document.getElementById('connectMetaMaskBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectMetaMask());
        }

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectMetaMask();
                } else {
                    this.metaMaskAddress = accounts[0];
                    this.updateMetaMaskUI();
                }
            });

            window.ethereum.on('chainChanged', () => {
                // Reload the page when chain changes
                window.location.reload();
            });
        }
    }

    async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.metaMaskAddress = accounts[0];
            this.metaMaskConnected = true;
            
            // Verify the wallet is connected to the correct network
            await this.verifyNetwork();
            
            this.updateMetaMaskUI();
            this.updateLoginButton();
            
            // Auto-complete login if credentials were already verified
            const metamaskSection = document.getElementById('metamaskSection');
            if (metamaskSection && metamaskSection.style.display !== 'none') {
                setTimeout(() => this.completeLogin(), 1000);
            }
            
            console.log('MetaMask connected:', this.metaMaskAddress);
            
        } catch (error) {
            console.error('MetaMask connection failed:', error);
            this.showMetaMaskError(error.message);
        }
    }

    async verifyNetwork() {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            // Use Holesky testnet
            const expectedChainId = '0x4268'; // 17000 in hex (Holesky)
            
            if (chainId !== expectedChainId) {
                // Try to switch to Holesky testnet first
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: expectedChainId }],
                    });
                } catch (switchError) {
                    // If Holesky doesn't exist, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: expectedChainId,
                                chainName: 'Holesky Test Network',
                                rpcUrls: ['https://ethereum-holesky.publicnode.com'],
                                blockExplorerUrls: ['https://holesky.etherscan.io'],
                                nativeCurrency: {
                                    name: 'HoleskyETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                }
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
        } catch (error) {
            console.error('Network verification failed:', error);
            throw new Error('Please connect to Holesky testnet');
        }
    }

    disconnectMetaMask() {
        this.metaMaskConnected = false;
        this.metaMaskAddress = null;
        this.updateMetaMaskUI();
        this.updateLoginButton();
    }

    updateMetaMaskUI() {
        const metamaskSection = document.getElementById('metamaskSection');
        const metamaskStatus = document.getElementById('metamaskStatus');
        const metamaskAddress = document.getElementById('metamaskAddress');
        const connectedAddress = document.getElementById('connectedAddress');
        const connectBtn = document.getElementById('connectMetaMaskBtn');

        if (this.metaMaskConnected && this.metaMaskAddress) {
            // Show connected state
            metamaskStatus.innerHTML = `
                <div class="metamask-connected">
                    <span class="metamask-icon">🦊</span>
                    <span>MetaMask connected</span>
                </div>
            `;
            
            metamaskAddress.style.display = 'block';
            connectedAddress.textContent = this.metaMaskAddress;
            connectBtn.textContent = 'Disconnect MetaMask';
            connectBtn.onclick = () => this.disconnectMetaMask();
        } else {
            // Show disconnected state
            metamaskStatus.innerHTML = `
                <div class="metamask-not-connected">
                    <span class="metamask-icon">🦊</span>
                    <span>MetaMask not connected</span>
                </div>
            `;
            
            metamaskAddress.style.display = 'none';
            connectBtn.textContent = 'Connect MetaMask Wallet';
            connectBtn.onclick = () => this.connectMetaMask();
        }
    }

    showMetaMaskError(message) {
        const metamaskStatus = document.getElementById('metamaskStatus');
        if (metamaskStatus) {
            metamaskStatus.innerHTML = `
                <div class="metamask-not-connected">
                    <span class="metamask-icon">⚠️</span>
                    <span>${message}</span>
                </div>
            `;
        }
    }

    updateLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            if (this.metaMaskConnected && this.metaMaskAddress) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login to System';
            } else {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Connect MetaMask First';
            }
        }
    }

    async waitForQRCodeLibrary() {
        // Wait for QR code utils to be available
        let attempts = 0;
        const maxAttempts = 50;
        
        while (typeof window.qrCodeUtils === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.qrCodeUtils === 'undefined') {
            console.warn('QRCode utils not loaded, using basic fallback');
        } else {
            console.log('✅ QRCode utils loaded successfully');
            // Wait for QR code utils to initialize
            await window.qrCodeUtils.init();
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // Login form - ensure clean setup
        setTimeout(() => {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                console.log('Login form found, setting up listener');
                loginForm.onsubmit = (e) => {
                    e.preventDefault();
                    console.log('Login form submitted');
                    this.handleLogin();
                };
            } else {
                console.error('Login form not found');
            }

            // Verifier link
            const verifierLink = document.getElementById('verifierLink');
            if (verifierLink) {
                console.log('Verifier link found');
                verifierLink.onclick = (e) => {
                    e.preventDefault();
                    console.log('Verifier link clicked');
                    this.showPage('verifierPortal');
                };
            }

            // Dashboard buttons
            const generateCertBtn = document.getElementById('generateCertBtn');
            if (generateCertBtn) {
                generateCertBtn.onclick = () => {
                    console.log('Generate cert button clicked');
                    this.showPage('certificateGeneration');
                };
            }

            const manageCertBtn = document.getElementById('manageCertBtn');
            if (manageCertBtn) {
                manageCertBtn.onclick = () => {
                    console.log('Manage cert button clicked');
                    this.showPage('certificateManagement');
                    this.renderCertificatesTable();
                };
            }

            const emailHistoryBtn = document.getElementById('emailHistoryBtn');
            if (emailHistoryBtn) {
                emailHistoryBtn.onclick = () => this.showEmailHistory();
            }

            // Certificate generation form
            const certificateForm = document.getElementById('certificateForm');
            if (certificateForm) {
                certificateForm.onsubmit = (e) => {
                    e.preventDefault();
                    this.generateCertificate();
                };

                // Real-time preview updates
                const inputs = certificateForm.querySelectorAll('input, select');
                inputs.forEach(input => {
                    input.oninput = () => {
                        this.updatePreview();
                    };
                });
            }

            // Preview button
            const previewBtn = document.getElementById('previewBtn');
            if (previewBtn) {
                previewBtn.onclick = () => this.updatePreview();
            }

            // Verification tabs
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.onclick = () => this.switchTab(btn.dataset.tab);
            });

            // Verification buttons
            const verifyCertIdBtn = document.getElementById('verifyCertIdBtn');
            if (verifyCertIdBtn) {
                verifyCertIdBtn.onclick = () => this.verifyCertificateById();
            }

            const verifyHashBtn = document.getElementById('verifyHashBtn');
            if (verifyHashBtn) {
                verifyHashBtn.onclick = () => this.verifyByBlockchainHash();
            }

            const verifyQRBtn = document.getElementById('verifyQRBtn');
            if (verifyQRBtn) {
                verifyQRBtn.onclick = () => this.verifyByQRCode();
            }

            // Search functionality
            const searchInput = document.getElementById('searchCertificates');
            if (searchInput) {
                searchInput.oninput = (e) => {
                    this.searchCertificates(e.target.value);
                };
            }

            // Export button
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.onclick = () => this.exportCertificates();
            }

            // Refresh button
            const refreshBtn = document.getElementById('refreshBtn');
            if (refreshBtn) {
                refreshBtn.onclick = () => this.refreshCertificateStatuses();
            }

            // Modal event listeners
            this.setupModalListeners();
        }, 100);
    }

    setupModalListeners() {
        // Email modal
        const closeEmailModal = document.getElementById('closeEmailModal');
        const cancelEmailBtn = document.getElementById('cancelEmailBtn');
        const sendEmailBtn = document.getElementById('sendEmailBtn');

        if (closeEmailModal) closeEmailModal.onclick = () => this.hideModal('emailModal');
        if (cancelEmailBtn) cancelEmailBtn.onclick = () => this.hideModal('emailModal');
        if (sendEmailBtn) sendEmailBtn.onclick = () => this.sendEmail();

        // Certificate modal
        const closeCertModal = document.getElementById('closeCertModal');
        const closeCertDetailBtn = document.getElementById('closeCertDetailBtn');
        const printCertBtn = document.getElementById('printCertBtn');
        const resendEmailBtn = document.getElementById('resendEmailBtn');

        if (closeCertModal) closeCertModal.onclick = () => this.hideModal('certificateModal');
        if (closeCertDetailBtn) closeCertDetailBtn.onclick = () => this.hideModal('certificateModal');
        if (printCertBtn) printCertBtn.onclick = () => this.printCertificate();
        if (resendEmailBtn) resendEmailBtn.onclick = () => this.resendEmail();

        // Click outside to close
        document.onclick = (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        };
    }

    renderNavigation() {
        const nav = document.getElementById('mainNav');
        if (!nav) return;

        if (this.currentUser) {
            nav.innerHTML = `
                <a href="#" class="nav-link" data-page="adminDashboard">Dashboard</a>
                <a href="#" class="nav-link" data-page="certificateGeneration">Generate</a>
                <a href="#" class="nav-link" data-page="certificateManagement">Manage</a>
                <a href="#" class="nav-link" data-page="verifierPortal">Verify</a>
                <a href="#" class="nav-link" id="logoutLink">Logout</a>
            `;

            // Bind navigation links
            setTimeout(() => {
                const navLinks = nav.querySelectorAll('.nav-link[data-page]');
                navLinks.forEach(link => {
                    link.onclick = (e) => {
                        e.preventDefault();
                        const page = link.dataset.page;
                        console.log(`Nav link clicked: ${page}`);
                        if (page === 'certificateManagement') {
                            this.renderCertificatesTable();
                        }
                        this.showPage(page);
                    };
                });

                // Bind logout
                const logoutLink = document.getElementById('logoutLink');
                if (logoutLink) {
                    logoutLink.onclick = (e) => {
                        e.preventDefault();
                        this.logout();
                    };
                }
            }, 50);
        } else {
            nav.innerHTML = `
                <a href="#" class="nav-link" data-page="verifierPortal">Verify Certificate</a>
                <a href="#" class="nav-link" data-page="loginPage">Admin Login</a>
            `;

            // Bind navigation links for non-logged-in state
            setTimeout(() => {
                const navLinks = nav.querySelectorAll('.nav-link[data-page]');
                navLinks.forEach(link => {
                    link.onclick = (e) => {
                        e.preventDefault();
                        const page = link.dataset.page;
                        console.log(`Public nav link clicked: ${page}`);
                        this.showPage(page);
                    };
                });
            }, 50);
        }
    }

    showPage(pageId) {
        console.log(`Showing page: ${pageId}`);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;

            // Update navigation active state
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });

            const activeNavLink = document.querySelector(`[data-page="${pageId}"]`);
            if (activeNavLink) {
                activeNavLink.classList.add('active');
            }

            console.log(`Successfully showed page: ${pageId}`);
        } else {
            console.error(`Page ${pageId} not found`);
        }
    }

    async handleLogin() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!usernameInput || !passwordInput) {
            console.error('Login form inputs not found');
            this.showNotification('Login form not found', 'error');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            this.showNotification('Please enter both username and password', 'error');
            return;
        }

        // Check if MetaMask is connected first
        if (!this.metaMaskConnected || !this.metaMaskAddress) {
            this.showNotification('Please connect MetaMask wallet first', 'error');
            return;
        }

        // Now authenticate credentials with MetaMask address
        await this.authenticateCredentials(username, password);
    }

    async authenticateCredentials(username, password) {
        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    metaMaskAddress: this.metaMaskAddress 
                })
            });

            const data = await response.json();

            if (data.success) {
                // Login successful, redirect to dashboard
                this.showNotification('Login successful! Redirecting to dashboard...', 'success');
                setTimeout(() => {
                    this.showPage('adminDashboard');
                }, 1000);
            } else {
                this.showNotification(data.error || 'Invalid credentials', 'error');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showNotification('Authentication failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showMetaMaskSection() {
        const metamaskSection = document.getElementById('metamaskSection');
        if (metamaskSection) {
            metamaskSection.style.display = 'block';
        }
        this.updateLoginButton();
    }

    async completeLogin() {
        // Check if MetaMask is connected
        if (!this.metaMaskConnected || !this.metaMaskAddress) {
            this.showNotification('Please connect your MetaMask wallet to continue', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username: document.getElementById('username').value.trim(),
                    password: document.getElementById('password').value.trim(),
                    metaMaskAddress: this.metaMaskAddress
                })
            });

            const data = await response.json();

            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('metaMaskAddress', this.metaMaskAddress);
                
                this.showNotification('Login successful! Welcome to the admin panel.', 'success');
                this.renderNavigation();
                this.showPage('adminDashboard');
                await this.updateStats();
            } else {
                this.showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        console.log('Logging out user');
        this.currentUser = null;
        this.authToken = null;
        localStorage.removeItem('authToken');
        this.renderNavigation();
        this.showPage('loginPage');
        this.showNotification('Logged out successfully.', 'info');
        
        // Reset form data
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            if (usernameInput) usernameInput.value = 'admin';
            if (passwordInput) passwordInput.value = 'admin123';
        }, 100);
    }

    async updateStats() {
        if (!this.currentUser) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/certificates/stats/overview`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const data = await response.json();

            if (data.success) {
                const stats = data.stats;
                
                const totalCertificatesEl = document.getElementById('totalCertificates');
                const todayCertificatesEl = document.getElementById('todayCertificates');
                const totalVerificationsEl = document.getElementById('totalVerifications');

                if (totalCertificatesEl) totalCertificatesEl.textContent = stats.totalCertificates || 0;
                if (todayCertificatesEl) todayCertificatesEl.textContent = stats.todayCertificates || 0;
                if (totalVerificationsEl) totalVerificationsEl.textContent = stats.totalVerifications || 0;
            }
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    // API Helper Methods
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }

    async verifyToken() {
        const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            this.currentUser = data.user;
            return true;
        } else {
            throw new Error('Token verification failed');
        }
    }

    generateCertificateId() {
        const prefix = 'DEIT';
        const year = new Date().getFullYear();
        const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
        return `${prefix}${year}${sequence}`;
    }

    generateBlockchainHash() {
        const chars = '0123456789abcdef';
        let hash = '0x';
        for (let i = 0; i < 64; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
        }
        return hash;
    }

    generateBlockNumber() {
        return Math.floor(Math.random() * 1000000) + 15000000;
    }

    updatePreview() {
        const preview = document.getElementById('certificatePreview');
        if (!preview) return;

        const formData = this.getFormData();
        if (!formData.studentName) {
            preview.innerHTML = '<p>Fill in the form to see certificate preview</p>';
            preview.classList.remove('has-content');
            return;
        }

        const certificateId = this.generateCertificateId();
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        preview.innerHTML = this.generateCertificateHTML(formData, certificateId, currentDate);
        preview.classList.add('has-content');

        // Generate QR code for preview
        setTimeout(() => {
            this.generateQRCode(formData, certificateId, 'preview');
        }, 100);
    }

    getFormData() {
        return {
            studentName: document.getElementById('studentName')?.value || '',
            parentName: document.getElementById('parentName')?.value || '',
            district: document.getElementById('district')?.value || '',
            state: document.getElementById('state')?.value || '',
            courseName: document.getElementById('courseName')?.value || '',
            studentEmail: document.getElementById('studentEmail')?.value || ''
        };
    }

    generateCertificateHTML(data, certificateId, date, blockchainHash = '') {
        return `
            <div class="certificate">
                <div class="certificate-border">
                    <div class="certificate-header">
                        <h1 class="institute-name">Digital Excellence Institute of Technology</h1>
                        <p class="institute-subtitle">Advancing Digital Skills & Innovation</p>
                        <div class="decorative-line"></div>
                    </div>

                    <div class="certificate-body">
                        <h2 class="certificate-title">Certificate of Completion</h2>
                        
                        <p class="certificate-text">This is to certify that</p>
                        <div class="student-name">${data.studentName.toUpperCase()}</div>
                        
                        <p class="certificate-text">
                            Son/Daughter of ${data.parentName}
                        </p>
                        
                        <p class="certificate-text">
                            District ${data.district}, State ${data.state}
                        </p>
                        
                        <p class="certificate-text">has successfully completed</p>
                        
                        <div class="course-name">${data.courseName}</div>
                        
                        <p class="certificate-text">
                            Date: ${date}
                        </p>
                    </div>

                    <div class="certificate-footer">
                        <div class="qr-section">
                            <canvas class="qr-code" id="qrcode-${certificateId}" width="100" height="100"></canvas>
                            <div class="certificate-id">ID: ${certificateId}</div>
                        </div>
                        
                        <div class="signature-section">
                            <div class="signature-line"></div>
                            <p class="director-name">Dr. Rajesh Kumar</p>
                            <p class="director-title">Director & CEO</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateQRCode(data, certificateId, context = 'certificate') {
        const canvasId = `qrcode-${certificateId}`;
        const canvas = document.getElementById(canvasId);

        if (!canvas) {
            setTimeout(() => this.generateQRCode(data, certificateId, context), 100);
            return;
        }

        // Use QR code utils if available
        if (window.qrCodeUtils && window.qrCodeUtils.isQRCodeLibraryLoaded()) {
            // Use the new QR code utility
            try {
                await window.qrCodeUtils.generateCertificateQRCodeCanvas(canvas, {
                    certificateId: certificateId,
                    studentName: data.studentName,
                    courseName: data.courseName,
                    issueDate: data.issueDate || new Date().toISOString().split('T')[0],
                    blockchainHash: data.blockchainHash || ''
                }, {
                    width: 100,
                    height: 100,
                    margin: 1,
                    color: {
                        dark: '#1e40af',
                        light: '#ffffff'
                    },
                    errorCorrectionLevel: 'M'
                });
                return;
            } catch (error) {
                console.error('QR Code generation failed with utils:', error);
            }
        }

        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not available');
            return;
        }

        const qrData = {
            certificateId: certificateId,
            studentName: data.studentName,
            courseName: data.courseName,
            institute: "Digital Excellence Institute of Technology",
            issueDate: new Date().toISOString().split('T')[0],
            verificationUrl: `https://verify.digitalexcellence.edu/certificate/${certificateId}`,
            blockchainHash: data.blockchainHash || ''
        };

        const qrString = JSON.stringify(qrData);

        try {
            await QRCode.toCanvas(canvas, qrString, {
                width: 100,
                height: 100,
                margin: 1,
                color: {
                    dark: '#1e40af',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });
        } catch (error) {
            console.error('QR Code generation failed:', error);
            this.drawQRCodeFallback(canvas, certificateId);
        }
    }

    drawQRCodeFallback(canvas, certificateId) {
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 0, 100, 100);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', 50, 45);
        ctx.fillText(certificateId, 50, 60);
    }

    async generateVerificationQRCode(certificate) {
        const canvas = document.getElementById('verificationQRCode');
        
        if (!canvas) {
            console.warn('Verification QR code canvas not found');
            return;
        }

        // Use QR code utils if available
        if (window.qrCodeUtils && window.qrCodeUtils.isQRCodeLibraryLoaded()) {
            try {
                await window.qrCodeUtils.generateCertificateQRCodeCanvas(canvas, {
                    certificateId: certificate.certificateId,
                    studentName: certificate.studentName,
                    courseName: certificate.courseName,
                    issueDate: certificate.issueDate || new Date().toISOString().split('T')[0],
                    blockchainHash: certificate.blockchainHash || ''
                }, {
                    width: 120,
                    height: 120,
                    margin: 1,
                    color: {
                        dark: '#1e40af',
                        light: '#ffffff'
                    },
                    errorCorrectionLevel: 'M'
                });
                return;
            } catch (error) {
                console.error('Verification QR Code generation failed with utils:', error);
            }
        }

        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library not available for verification');
            return;
        }

        const qrData = {
            certificateId: certificate.certificateId,
            studentName: certificate.studentName,
            courseName: certificate.courseName,
            institute: "Digital Excellence Institute of Technology",
            issueDate: new Date(certificate.issueDate).toISOString().split('T')[0],
            verificationUrl: `${window.location.origin}/verify/${certificate.certificateId}`,
            blockchainHash: certificate.blockchainHash || ''
        };

        const qrString = JSON.stringify(qrData);

        try {
            await QRCode.toCanvas(canvas, qrString, {
                width: 120,
                height: 120,
                margin: 1,
                color: {
                    dark: '#1e40af',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'M'
            });
        } catch (error) {
            console.error('Verification QR Code generation failed:', error);
            this.drawVerificationQRCodeFallback(canvas, certificate.certificateId);
        }
    }

    drawVerificationQRCodeFallback(canvas, certificateId) {
        const ctx = canvas.getContext('2d');
        canvas.width = 120;
        canvas.height = 120;
        
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 0, 120, 120);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', 60, 50);
        ctx.fillText(certificateId, 60, 70);
    }

    async generateCertificate() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiRequest('/certificates', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response.success) {
                const certificate = response.certificate;
                
                // Show blockchain status
                this.showBlockchainStatus(
                    certificate.transactionHash,
                    certificate.blockNumber,
                    certificate.gasUsed
                );

                // Generate final certificate with blockchain hash
                const currentDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const preview = document.getElementById('certificatePreview');
                if (preview) {
                    preview.innerHTML = this.generateCertificateHTML(certificate, certificate.certificateId, currentDate, certificate.blockchainHash);
                    preview.classList.add('has-content');
                    
                    // Generate QR code with blockchain hash
                    setTimeout(() => {
                        this.generateQRCode(certificate, certificate.certificateId, 'certificate');
                    }, 100);
                }

                // Show success message with email confirmation
                await this.simulateDelay(1000);
                this.showNotification(`Certificate generated successfully! Email sent to ${certificate.studentEmail}`, 'success');
                await this.updateStats();

                // Clear form
                this.clearForm();
            } else {
                this.showNotification(response.error || 'Failed to generate certificate', 'error');
            }

        } catch (error) {
            console.error('Certificate generation failed:', error);
            this.showNotification('Failed to generate certificate. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showBlockchainStatus(txHash, blockNumber, gasUsed) {
        const statusDiv = document.getElementById('blockchainStatus');
        if (!statusDiv) return;

        const txHashEl = document.getElementById('txHash');
        const blockNumberEl = document.getElementById('blockNumber');
        const gasUsedEl = document.getElementById('gasUsed');

        if (txHashEl) txHashEl.textContent = txHash;
        if (blockNumberEl) blockNumberEl.textContent = blockNumber.toLocaleString();
        if (gasUsedEl) gasUsedEl.textContent = gasUsed;

        statusDiv.style.display = 'block';
    }

    showEmailPreview(certificate) {
        const modal = document.getElementById('emailModal');
        const preview = document.getElementById('emailPreview');
        
        if (!modal || !preview) return;

        preview.innerHTML = this.generateEmailHTML(certificate);
        this.showModal('emailModal');
        
        // Store certificate for sending
        this.pendingEmailCertificate = certificate;
    }

    generateEmailHTML(certificate) {
        return `
            <div class="email-header">
                <div class="email-subject">Your Certificate from Digital Excellence Institute</div>
                <div class="email-from">From: certificates@digitalexcellence.edu</div>
                <div class="email-from">To: ${certificate.studentEmail}</div>
            </div>
            
            <div class="email-body">
                <p>Dear ${certificate.studentName},</p>
                
                <p>Congratulations! We are pleased to inform you that your certificate has been successfully generated and stored on the blockchain.</p>
                
                <div class="email-details">
                    <h4>Certificate Details:</h4>
                    <ul>
                        <li><strong>Certificate ID:</strong> ${certificate.id}</li>
                        <li><strong>Course:</strong> ${certificate.courseName}</li>
                        <li><strong>Issue Date:</strong> ${new Date(certificate.generatedDate).toLocaleDateString()}</li>
                        <li><strong>Verification Link:</strong> <a href="https://verify.digitalexcellence.edu/certificate/${certificate.id}" target="_blank">Verify Certificate</a></li>
                        <li><strong>Blockchain Hash:</strong> ${certificate.blockchainHash}</li>
                    </ul>
                </div>
                
                <p>Your certificate is now permanently stored on the blockchain, ensuring its authenticity and preventing tampering.</p>
                
                <div class="email-attachment-list">
                    <h4>Attachments:</h4>
                    <ul>
                        <li>📄 Certificate.pdf</li>
                        <li>🔍 QR_Code.png</li>
                        <li>🔗 Verification_Instructions.pdf</li>
                    </ul>
                </div>
                
                <p>Best regards,<br>
                Digital Excellence Institute of Technology<br>
                Advancing Digital Skills & Innovation</p>
            </div>
        `;
    }

    async sendEmail() {
        if (!this.pendingEmailCertificate) return;

        this.showLoading(true);
        
        try {
            const response = await this.apiRequest(`/certificates/${this.pendingEmailCertificate.certificateId}/resend-email`, {
                method: 'POST'
            });

            if (response.success) {
                this.hideModal('emailModal');
                this.showNotification('Email sent successfully to student!', 'success');
                this.pendingEmailCertificate = null;
            } else {
                this.showNotification(response.error || 'Failed to send email', 'error');
            }

        } catch (error) {
            console.error('Email sending failed:', error);
            this.showNotification('Failed to send email. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    clearForm() {
        const form = document.getElementById('certificateForm');
        if (form) {
            form.reset();
        }
        
        const preview = document.getElementById('certificatePreview');
        if (preview) {
            preview.innerHTML = '<p>Fill in the form to see certificate preview</p>';
            preview.classList.remove('has-content');
        }
    }

    async renderCertificatesTable() {
        const tbody = document.getElementById('certificatesTableBody');
        if (!tbody) return;

        try {
            const response = await this.apiRequest('/certificates');
            
            if (response.success) {
                this.certificates = response.certificates;
                
                if (this.certificates.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; color: var(--color-text-secondary);">
                                No certificates generated yet
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = this.certificates.map(cert => `
                    <tr>
                        <td>${cert.certificateId}</td>
                        <td>${cert.studentName}</td>
                        <td>${cert.courseName}</td>
                        <td>${new Date(cert.generatedDate).toLocaleDateString()}</td>
                        <td class="status-cell">
                            <span class="status-badge status-${cert.status}">
                                ${cert.status === 'revoked' ? '🚫 Revoked' : cert.status === 'verified' ? '✅ Verified' : '📄 Issued'}
                            </span>
                        </td>
                        <td title="${cert.blockchainHash}" style="font-family: monospace; font-size: 12px;">
                            ${cert.blockchainHash.substring(0, 10)}...
                        </td>
                        <td>
                            <div class="table-actions">
                                <button class="btn btn--sm btn--outline" onclick="app.viewCertificate('${cert.certificateId}')">View</button>
                                <button class="btn btn--sm btn--secondary" onclick="app.downloadPDF('${cert.certificateId}')">PDF</button>
                                <button class="btn btn--sm btn--primary" onclick="app.resendEmailById('${cert.certificateId}')">Email</button>
                                ${cert.status !== 'revoked' ? `<button class="btn btn--sm btn--danger" onclick="app.showRevocationModal('${cert.certificateId}')">Revoke</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load certificates:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--color-error);">
                        Failed to load certificates
                    </td>
                </tr>
            `;
        }
    }

    searchCertificates(query) {
        if (!query.trim()) {
            this.renderCertificatesTable();
            return;
        }

        const filtered = this.certificates.filter(cert => 
            cert.certificateId.toLowerCase().includes(query.toLowerCase()) ||
            cert.studentName.toLowerCase().includes(query.toLowerCase()) ||
            cert.courseName.toLowerCase().includes(query.toLowerCase()) ||
            cert.blockchainHash.toLowerCase().includes(query.toLowerCase())
        );

        const tbody = document.getElementById('certificatesTableBody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--color-text-secondary);">
                        No certificates found matching "${query}"
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(cert => `
            <tr>
                <td>${cert.certificateId}</td>
                <td>${cert.studentName}</td>
                <td>${cert.courseName}</td>
                <td>${new Date(cert.generatedDate).toLocaleDateString()}</td>
                <td class="status-cell">
                    <span class="status-badge status-${cert.status}">
                        ${cert.status === 'revoked' ? '🚫 Revoked' : cert.status === 'verified' ? '✅ Verified' : '📄 Issued'}
                    </span>
                </td>
                <td title="${cert.blockchainHash}" style="font-family: monospace; font-size: 12px;">
                    ${cert.blockchainHash.substring(0, 10)}...
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn--sm btn--outline" onclick="app.viewCertificate('${cert.certificateId}')">View</button>
                        <button class="btn btn--sm btn--primary" onclick="app.resendEmailById('${cert.certificateId}')">Email</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    viewCertificate(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) {
            this.showNotification('Certificate not found', 'error');
            return;
        }

        // Check if PDF exists
        if (!certificate.pdfPath) {
            this.showNotification('PDF not found for this certificate', 'error');
            return;
        }

        // Show PDF within the system using modal
        this.showPDFModal(certificate);
        this.currentViewingCertificate = certificate;
    }

    // Show PDF in modal within the system
    showPDFModal(certificate) {
        const modal = document.getElementById('certificateModal');
        const detail = document.getElementById('certificateDetail');
        
        if (!modal || !detail) return;

        // Extract just the filename from the full path
        let pdfFileName;
        if (certificate.pdfPath.includes('/')) {
            pdfFileName = certificate.pdfPath.split('/').pop();
        } else if (certificate.pdfPath.includes('\\')) {
            pdfFileName = certificate.pdfPath.split('\\').pop();
        } else {
            pdfFileName = certificate.pdfPath;
        }
        const pdfUrl = `/certificates/${pdfFileName}`;
        
        detail.innerHTML = `
            <div class="pdf-viewer-container">
                <div class="pdf-header">
                    <h3>Certificate: ${certificate.certificateId}</h3>
                    <div class="pdf-actions">
                        <button class="btn btn--primary" onclick="app.printPDF('${pdfUrl}')">
                            🖨️ Print Certificate
                        </button>
                        <button class="btn btn--secondary" onclick="window.open('${pdfUrl}', '_blank')">
                            📄 Open in New Tab
                        </button>
                    </div>
                </div>
                <div class="pdf-viewer">
                    <iframe 
                        src="${pdfUrl}" 
                        width="100%" 
                        height="600px" 
                        frameborder="0"
                        title="Certificate PDF">
                    </iframe>
                </div>
                <div class="pdf-info">
                    <p><strong>Student:</strong> ${certificate.studentName}</p>
                    <p><strong>Course:</strong> ${certificate.courseName}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${certificate.status}">${certificate.status}</span></p>
                    <p><strong>Transaction Hash:</strong> <span class="transaction-hash">${certificate.transactionHash || 'N/A'}</span></p>
                </div>
            </div>
        `;
        
        this.showModal('certificateModal');
    }

    // Print the actual PDF file
    printPDF(pdfUrl) {
        // Create a new window with the PDF for printing
        const printWindow = window.open(pdfUrl, '_blank');
        
        if (printWindow) {
            printWindow.onload = function() {
                printWindow.focus();
                printWindow.print();
            };
        } else {
            // Fallback: open in new tab if popup blocked
            window.open(pdfUrl, '_blank');
            this.showNotification('Please use Ctrl+P to print the PDF', 'info');
        }
    }

    // Alternative method to show certificate details in modal
    showCertificateDetails(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) {
            this.showNotification('Certificate not found', 'error');
            return;
        }

        const modal = document.getElementById('certificateModal');
        const detail = document.getElementById('certificateDetail');
        
        if (!modal || !detail) return;

        const currentDate = new Date(certificate.generatedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        detail.innerHTML = `
            <div class="certificate-details">
                <h3>Certificate Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Certificate ID:</label>
                        <span>${certificate.certificateId}</span>
                    </div>
                    <div class="detail-item">
                        <label>Student Name:</label>
                        <span>${certificate.studentName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Parent Name:</label>
                        <span>${certificate.parentName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Course:</label>
                        <span>${certificate.courseName}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${certificate.studentEmail}</span>
                    </div>
                    <div class="detail-item">
                        <label>Location:</label>
                        <span>${certificate.district}, ${certificate.state}</span>
                    </div>
                    <div class="detail-item">
                        <label>Issue Date:</label>
                        <span>${currentDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${certificate.status}">${certificate.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Transaction Hash:</label>
                        <span class="transaction-hash">${certificate.transactionHash || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Block Number:</label>
                        <span>${certificate.blockNumber || 'N/A'}</span>
                    </div>
                </div>
                <div class="certificate-actions">
                    <button class="btn btn--primary" onclick="window.open('/certificates/${certificate.pdfPath.split('/').pop()}', '_blank')">
                        📄 View PDF
                    </button>
                    <button class="btn btn--secondary" onclick="window.open('/qr-codes/${certificate.qrCodePath.split('/').pop()}', '_blank')">
                        📱 View QR Code
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('certificateModal');
        this.currentViewingCertificate = certificate;
    }

    printCertificateById(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) {
            this.showNotification('Certificate not found', 'error');
            return;
        }

        this.currentViewingCertificate = certificate;
        this.printCertificate();
    }

    printCertificate() {
        if (!this.currentViewingCertificate) return;

        const certificate = this.currentViewingCertificate;
        const currentDate = new Date(certificate.generatedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const printWindow = window.open('', '_blank');
        const certificateHTML = this.generateCertificateHTML(certificate, certificate.id, currentDate, certificate.blockchainHash);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificate - ${certificate.id}</title>
                <meta charset="UTF-8">
                <style>
                    body { margin: 0; padding: 20px; background: white; font-family: Arial, sans-serif; }
                    .certificate { width: 100%; max-width: none; }
                    .certificate-border { padding: 40px; border: 6px solid #1e40af; border-radius: 12px; }
                    .certificate-header { text-align: center; margin-bottom: 40px; }
                    .institute-name { font-size: 36px; font-weight: bold; color: #1e40af; margin-bottom: 8px; }
                    .institute-subtitle { font-size: 16px; font-style: italic; color: #f59e0b; margin-bottom: 20px; }
                    .decorative-line { width: 150px; height: 3px; background: linear-gradient(to right, #1e40af, #d4af37, #1e40af); margin: 0 auto; }
                    .certificate-body { text-align: center; margin-bottom: 40px; }
                    .certificate-title { font-size: 42px; font-weight: 600; color: #1e40af; margin-bottom: 30px; text-decoration: underline; text-decoration-color: #d4af37; }
                    .student-name { font-size: 32px; font-weight: bold; color: #1e40af; margin: 20px 0; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #d4af37; padding-bottom: 8px; display: inline-block; }
                    .certificate-text { font-size: 18px; color: #1e3a8a; margin: 12px 0; }
                    .course-name { font-size: 24px; font-weight: 600; color: #1e40af; margin: 20px 0; font-style: italic; }
                    .certificate-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
                    .qr-section, .signature-section { text-align: center; }
                    .qr-code { border: 2px solid #1e40af; border-radius: 8px; padding: 8px; background: white; margin-bottom: 8px; }
                    .certificate-id { font-size: 14px; color: #1e3a8a; font-weight: bold; }
                    .signature-line { width: 150px; height: 2px; background: #1e40af; margin: 0 auto 8px auto; }
                    .director-name { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 4px; }
                    .director-title { font-size: 14px; color: #1e3a8a; }
                    @page { margin: 0.5in; }
                </style>
            </head>
            <body>
                ${certificateHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    }
                </script>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        this.showNotification('Opening print dialog...', 'success');
    }

    resendEmailById(certificateId) {
        const certificate = this.certificates.find(c => c.certificateId === certificateId);
        if (!certificate) {
            this.showNotification('Certificate not found', 'error');
            return;
        }

        this.pendingEmailCertificate = certificate;
        this.showEmailPreview(certificate);
    }

    resendEmail() {
        if (this.currentViewingCertificate) {
            this.pendingEmailCertificate = this.currentViewingCertificate;
            this.hideModal('certificateModal');
            this.showEmailPreview(this.currentViewingCertificate);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const activePanel = document.getElementById(`${tabName}Tab`);
        if (activePanel) activePanel.classList.add('active');
    }

    async verifyCertificateById() {
        const certificateId = document.getElementById('verifyCertId').value.trim();
        if (!certificateId) {
            this.showNotification('Please enter a certificate ID', 'warning');
            return;
        }

        // Show loading state
        this.setButtonLoading('verifyCertIdBtn', true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/verification/certificate-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ certificateId })
            });

            const data = await response.json();
            this.showVerificationResult(data, 'Certificate ID', certificateId);
            
        } catch (error) {
            console.error('Verification failed:', error);
            this.showVerificationResult(null, 'Certificate ID', certificateId);
        } finally {
            // Hide loading state
            this.setButtonLoading('verifyCertIdBtn', false);
        }
    }

    async verifyByBlockchainHash() {
        const hash = document.getElementById('verifyHashInput').value.trim();
        if (!hash) {
            this.showNotification('Please enter a blockchain hash', 'warning');
            return;
        }

        // Show loading state
        this.setButtonLoading('verifyHashBtn', true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/verification/blockchain-hash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hash })
            });

            const data = await response.json();
            this.showVerificationResult(data, 'Transaction Hash', hash);
            
        } catch (error) {
            console.error('Verification failed:', error);
            this.showVerificationResult(null, 'Transaction Hash', hash);
        } finally {
            // Hide loading state
            this.setButtonLoading('verifyHashBtn', false);
        }
    }

    async verifyByQRCode() {
        const qrData = document.getElementById('qrCodeInput').value.trim();
        if (!qrData) {
            this.showNotification('Please paste QR code content', 'warning');
            return;
        }

        // Show loading state
        this.setButtonLoading('verifyQRBtn', true);

        // Try to parse QR data as JSON first
        let parsedData = null;
        let certificateId = null;
        
        try {
            parsedData = JSON.parse(qrData);
            if (parsedData.certificateId) {
                certificateId = parsedData.certificateId;
            }
        } catch (e) {
            // Not JSON, might be a simple certificate ID or other format
            console.log('QR data is not JSON, treating as raw data:', qrData);
            
            // Check if it looks like a certificate ID (starts with letters and contains numbers)
            if (/^[A-Z]{4}\d+$/.test(qrData)) {
                certificateId = qrData;
            } else {
                // Try to extract certificate ID from URL or other formats
                const urlMatch = qrData.match(/\/verify\/([A-Z]{4}\d+)/);
                if (urlMatch) {
                    certificateId = urlMatch[1];
                } else {
                    // Show error with what was actually scanned
                    this.showNotification(`QR code contains: "${qrData}" - This doesn't appear to be a valid certificate QR code from our system.`, 'error');
                    this.setButtonLoading('verifyQRBtn', false);
                    return;
                }
            }
        }

        try {
            let response;
            
            if (certificateId) {
                // Use certificate ID verification
                response = await fetch(`${this.apiBaseUrl}/verification/certificate-id`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ certificateId })
                });
            } else {
                // Use QR code verification for complex data
                response = await fetch(`${this.apiBaseUrl}/verification/qr-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qrData })
            });
            }

            const data = await response.json();
            this.showVerificationResult(data, 'QR Code', data.certificate?.certificateId || certificateId || 'Unknown');
            
        } catch (error) {
            console.error('Verification failed:', error);
            this.showVerificationResult(null, 'QR Code', 'Invalid');
        } finally {
            // Hide loading state
            this.setButtonLoading('verifyQRBtn', false);
        }
    }

    // Webcam QR Code Scanning
    initializeQRScanner() {
        const startCameraBtn = document.getElementById('startCameraBtn');
        const stopCameraBtn = document.getElementById('stopCameraBtn');
        const scanQRBtn = document.getElementById('scanQRBtn');
        const qrStatus = document.getElementById('qrStatus');
        const qrVideo = document.getElementById('qrVideo');
        const qrCanvas = document.getElementById('qrCanvas');
        const qrCodeInput = document.getElementById('qrCodeInput');

        if (!startCameraBtn || !stopCameraBtn) return;

        let stream = null;
        let scanning = false;

        startCameraBtn.onclick = async () => {
            try {
                qrStatus.innerHTML = '<p>Requesting camera access...</p>';
                
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment', // Use back camera if available
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    } 
                });
                
                qrVideo.srcObject = stream;
                qrVideo.style.display = 'block';
                qrVideo.play();
                
                startCameraBtn.style.display = 'none';
                stopCameraBtn.style.display = 'inline-block';
                scanQRBtn.style.display = 'inline-block';
                qrStatus.innerHTML = '<p style="color: green;">Camera started. Click "Scan QR Code" to begin scanning.</p>';
                
            } catch (error) {
                console.error('Camera access failed:', error);
                qrStatus.innerHTML = '<p style="color: red;">Camera access denied or not available. Please use manual input.</p>';
            }
        };

        scanQRBtn.onclick = () => {
            if (!scanning) {
                scanning = true;
                scanQRBtn.innerHTML = 'Stop Scanning';
                qrStatus.innerHTML = '<p style="color: blue;">Scanning for QR codes... Point camera at QR code.</p>';
                this.startQRScanning();
            } else {
                this.stopQRScanning();
                scanning = false;
                scanQRBtn.innerHTML = 'Scan QR Code';
                qrStatus.innerHTML = '<p style="color: green;">Camera ready. Click "Scan QR Code" to begin scanning.</p>';
            }
        };

        stopCameraBtn.onclick = () => {
            this.stopQRScanning();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            qrVideo.style.display = 'none';
            startCameraBtn.style.display = 'inline-block';
            stopCameraBtn.style.display = 'none';
            scanQRBtn.style.display = 'none';
            scanning = false;
            qrStatus.innerHTML = '<p>Click "Start Camera" to begin QR code scanning</p>';
        };
    }

    startQRScanning() {
        const qrVideo = document.getElementById('qrVideo');
        const qrCanvas = document.getElementById('qrCanvas');
        const qrStatus = document.getElementById('qrStatus');
        const qrCodeInput = document.getElementById('qrCodeInput');
        const scanQRBtn = document.getElementById('scanQRBtn');

        if (!qrVideo || !qrCanvas) return;

        const canvas = qrCanvas;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        const scanFrame = () => {
            // Check if scanning is still active
            if (scanQRBtn && scanQRBtn.innerHTML === 'Stop Scanning') {
                if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
                    canvas.width = qrVideo.videoWidth;
                    canvas.height = qrVideo.videoHeight;
                    context.drawImage(qrVideo, 0, 0, canvas.width, canvas.height);

                    // Try to decode QR code using jsQR
                    if (typeof jsQR !== 'undefined') {
                        try {
                            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            if (code) {
                                this.handleQRCodeDetected(code.data);
                                return; // Stop scanning once QR code is found
                            }
                        } catch (error) {
                            console.error('QR code detection error:', error);
                        }
                    } else {
                        console.warn('jsQR library not loaded');
                    }
                }
                
                // Continue scanning
                requestAnimationFrame(scanFrame);
            }
        };

        scanFrame();
    }


    handleQRCodeDetected(qrData) {
        const qrCodeInput = document.getElementById('qrCodeInput');
        const qrStatus = document.getElementById('qrStatus');
        const scanQRBtn = document.getElementById('scanQRBtn');
        
        if (qrData && qrCodeInput) {
            qrCodeInput.value = qrData;
            qrStatus.innerHTML = `<p style="color: green;">QR Code detected: "${qrData}"<br>Click "Verify QR Code" to proceed.</p>`;
            
            // Stop scanning
            if (scanQRBtn) {
                scanQRBtn.innerHTML = 'Scan QR Code';
            }
            
            // Auto-verify after a short delay
            setTimeout(() => {
                this.verifyByQRCode();
            }, 1000);
        }
    }

    stopQRScanning() {
        // Stop the scanning loop
        const stopCameraBtn = document.getElementById('stopCameraBtn');
        if (stopCameraBtn) {
            stopCameraBtn.style.display = 'none';
        }
    }

    showVerificationResult(data, method, identifier) {
        const resultDiv = document.getElementById('verificationResult');
        if (!resultDiv) return;

        if (data && data.success && data.valid) {
            const certificate = data.certificate;
            const verificationDate = new Date(data.verifiedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            resultDiv.innerHTML = `
                <div class="verification-success">
                    <div class="verification-header">
                        <div class="verification-icon success">✓</div>
                        <div>
                            <h3 style="margin: 0; color: var(--color-success);">Certificate Verified</h3>
                            <p style="margin: 0; color: var(--color-text-secondary);">This certificate is authentic and valid</p>
                        </div>
                    </div>
                    
                    <div class="certificate-details">
                        <h4>Certificate Details:</h4>
                        <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div><strong>Certificate ID:</strong> ${certificate.certificateId}</div>
                            <div><strong>Student Name:</strong> ${certificate.studentName}</div>
                            <div><strong>Course:</strong> ${certificate.courseName}</div>
                            <div><strong>Issue Date:</strong> ${new Date(certificate.issueDate).toLocaleDateString()}</div>
                            <div><strong>Parent Name:</strong> ${certificate.parentName}</div>
                            <div><strong>Location:</strong> ${certificate.district}, ${certificate.state}</div>
                            <div><strong>Status:</strong> 
                                <span class="status-badge status-${certificate.status}">
                                    ${certificate.status === 'revoked' ? '🚫 Revoked' : certificate.status === 'verified' ? '✅ Verified' : '📄 Issued'}
                                </span>
                            </div>
                            ${certificate.status === 'revoked' ? `
                                <div><strong>Revocation Reason:</strong> ${certificate.revocationReason}</div>
                                <div><strong>Revoked Date:</strong> ${new Date(certificate.revokedDate).toLocaleDateString()}</div>
                                <div><strong>Revoked By:</strong> ${certificate.revokedBy}</div>
                            ` : ''}
                        </div>
                        
                        <h4>Blockchain Information:</h4>
                        <div style="background: var(--color-bg-1); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <div><strong>Transaction Hash:</strong><br><code style="font-size: 12px; word-break: break-all;">${certificate.transactionHash}</code></div>
                            <div style="margin-top: 8px;"><strong>Block Number:</strong> ${certificate.blockNumber?.toLocaleString()}</div>
                            <div><strong>Verification Count:</strong> ${certificate.verificationCount || 1}</div>
                        </div>
                        
                        <h4>QR Code:</h4>
                        <div style="text-align: center; margin-bottom: 16px;">
                            <canvas id="verificationQRCode" style="display: inline-block; border: 2px solid #1e40af; border-radius: 8px; padding: 8px; background: white;"></canvas>
                        </div>
                        
                        <div class="verification-meta">
                            <small>Verified via ${method} on ${verificationDate}</small>
                            <br>
                            <small style="color: var(--color-text-secondary); font-style: italic;">
                                ${data.blockchain && data.blockchain.verificationMethod === 'blockchain' 
                                    ? 'Verified using database + blockchain' 
                                    : data.blockchain && data.blockchain.verificationMethod === 'database_fallback'
                                    ? 'Verified using database only (blockchain unavailable)'
                                    : 'Verified using database only'}
                            </small>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('verification-success');
            resultDiv.classList.remove('verification-error');
            
            // Generate QR code for verification result
            setTimeout(() => {
                this.generateVerificationQRCode(certificate);
            }, 100);
            
        } else if (data && data.certificate && data.certificate.status === 'revoked') {
            // Handle revoked certificate
            const certificate = data.certificate;
            
            resultDiv.innerHTML = `
                <div class="verification-error">
                    <div class="verification-header">
                        <div class="verification-icon error">🚫</div>
                        <div>
                            <h3 style="margin: 0; color: var(--color-error);">Certificate Revoked</h3>
                            <p style="margin: 0; color: var(--color-text-secondary);">This certificate has been revoked and is no longer valid</p>
                        </div>
                    </div>
                    
                    <div class="certificate-details">
                        <h4>Certificate Details:</h4>
                        <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div><strong>Certificate ID:</strong> ${certificate.certificateId}</div>
                            <div><strong>Student Name:</strong> ${certificate.studentName}</div>
                            <div><strong>Course:</strong> ${certificate.courseName}</div>
                            <div><strong>Issue Date:</strong> ${new Date(certificate.issueDate).toLocaleDateString()}</div>
                            <div><strong>Parent Name:</strong> ${certificate.parentName}</div>
                            <div><strong>Location:</strong> ${certificate.district}, ${certificate.state}</div>
                        </div>
                        
                        <h4>Revocation Information:</h4>
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <div><strong>Revocation Reason:</strong> ${certificate.revocationReason}</div>
                            <div style="margin-top: 8px;"><strong>Revoked Date:</strong> ${new Date(certificate.revokedDate).toLocaleDateString()}</div>
                            <div><strong>Revoked By:</strong> ${certificate.revokedBy}</div>
                        </div>
                        
                        <div class="verification-meta">
                            <small>Verified via ${method} on ${new Date().toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('verification-error');
            resultDiv.classList.remove('verification-success');
            
        } else {
            const errorMessage = data?.message || 'Certificate not found';
            
            resultDiv.innerHTML = `
                <div class="verification-error">
                    <div class="verification-header">
                        <div class="verification-icon error">✗</div>
                        <div>
                            <h3 style="margin: 0; color: var(--color-error);">Certificate Not Found</h3>
                            <p style="margin: 0; color: var(--color-text-secondary);">${errorMessage}</p>
                        </div>
                    </div>
                    
                    <div class="verification-details">
                        <p><strong>Searched for:</strong> ${identifier}</p>
                        <p><strong>Method:</strong> ${method}</p>
                        <p><strong>Result:</strong> No matching certificate found in our blockchain records</p>
                        
                        <div style="margin-top: 16px; padding: 12px; background: var(--color-bg-4); border-radius: 8px;">
                            <h5>Possible reasons:</h5>
                            <ul style="margin: 8px 0; padding-left: 20px;">
                                <li>The certificate ID/hash is incorrect</li>
                                <li>The certificate was not issued by our institute</li>
                                <li>The certificate may have been revoked</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
            resultDiv.classList.add('verification-error');
            resultDiv.classList.remove('verification-success');
        }

        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    logVerification(method, identifier, success) {
        this.verificationLog.push({
            method,
            identifier,
            success,
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1' // Simulated
        });
        this.saveVerificationLog();
    }

    async downloadPDF(certificateId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/certificates/${certificateId}/download/pdf`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Certificate_${certificateId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                this.showNotification('PDF downloaded successfully', 'success');
            } else {
                this.showNotification('Failed to download PDF', 'error');
            }
        } catch (error) {
            console.error('Download PDF error:', error);
            this.showNotification('Failed to download PDF', 'error');
        }
    }

    async exportCertificates() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/certificates/export/csv`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `certificates_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                this.showNotification('Certificates exported successfully', 'success');
            } else {
                this.showNotification('Failed to export certificates', 'error');
            }
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export certificates', 'error');
        }
    }

    generateCSV() {
        const headers = ['Certificate ID', 'Student Name', 'Parent Name', 'District', 'State', 'Course', 'Email', 'Generated Date', 'Transaction Hash', 'Email Sent', 'Verification Count'];
        
        const rows = this.certificates.map(cert => [
            cert.certificateId,
            cert.studentName,
            cert.parentName,
            cert.district,
            cert.state,
            cert.courseName,
            cert.studentEmail,
            new Date(cert.generatedDate).toLocaleDateString(),
            cert.blockchainHash,
            cert.emailSent ? 'Yes' : 'No',
            cert.verificationCount || 0
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    async showEmailHistory() {
        try {
            // Show loading state
            this.showNotification('Loading email history...', 'info');
            
            // Fetch email history from API
            const response = await this.apiRequest('/certificates/email-history');
            
            if (!response.success) {
                this.showNotification('Failed to load email history', 'error');
                return;
            }

            const emailHistory = response.emailHistory;
            const stats = response.stats;

            if (emailHistory.length === 0) {
            this.showNotification('No email history found', 'info');
            return;
        }

            const historyHTML = emailHistory.map(email => `
            <div style="border: 1px solid var(--color-border); padding: 12px; margin-bottom: 8px; border-radius: 8px;">
                <div><strong>${email.studentName}</strong> (${email.studentEmail})</div>
                <div>Certificate: ${email.certificateId}</div>
                    <div>Subject: ${email.subject}</div>
                <div>Sent: ${new Date(email.sentDate).toLocaleString()}</div>
                    <div>Status: <span class="status status--${email.status === 'sent' ? 'success' : email.status === 'failed' ? 'error' : 'warning'}">${email.status}</span></div>
                    ${email.errorMessage ? `<div style="color: var(--color-error); font-size: 12px;">Error: ${email.errorMessage}</div>` : ''}
            </div>
        `).join('');

            const statsHTML = `
                <div style="background: var(--color-background-secondary); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0;">Email Statistics</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <div><strong>Total:</strong> ${stats.totalEmails}</div>
                        <div><strong>Sent:</strong> ${stats.sentEmails}</div>
                        <div><strong>Failed:</strong> ${stats.failedEmails}</div>
                        <div><strong>Today:</strong> ${stats.todayEmails}</div>
                    </div>
                </div>
            `;

        // Create a simple modal for email history
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>Email History</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                        ${statsHTML}
                        <h4 style="margin: 20px 0 10px 0;">Recent Emails</h4>
                    ${historyHTML}
                </div>
                <div class="modal-footer">
                    <button class="btn btn--outline">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.modal-close').onclick = () => {
            document.body.removeChild(modal);
        };
        modal.querySelector('.btn--outline').onclick = () => {
            document.body.removeChild(modal);
        };
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        } catch (error) {
            console.error('Error loading email history:', error);
            this.showNotification('Failed to load email history', 'error');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            if (show) {
                spinner.classList.remove('hidden');
            } else {
                spinner.classList.add('hidden');
            }
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            // Create notification container if it doesn't exist
            const newContainer = document.createElement('div');
            newContainer.id = 'notificationContainer';
            newContainer.className = 'notification-container';
            document.body.appendChild(newContainer);
            this.showNotification(message, type);
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);

        // Close button
        notification.querySelector('.notification-close').onclick = () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        };
    }

    setButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        const textSpan = document.getElementById(buttonId + 'Text');
        const loadingSpan = document.getElementById(buttonId + 'Loading');

        if (isLoading) {
            button.disabled = true;
            if (textSpan) textSpan.style.display = 'none';
            if (loadingSpan) loadingSpan.style.display = 'inline';
        } else {
            button.disabled = false;
            if (textSpan) textSpan.style.display = 'inline';
            if (loadingSpan) loadingSpan.style.display = 'none';
        }
    }

    validateForm(data) {
        const requiredFields = [
            { field: 'studentName', name: 'Student Name' },
            { field: 'parentName', name: 'Parent Name' },
            { field: 'district', name: 'District' },
            { field: 'state', name: 'State' },
            { field: 'courseName', name: 'Course Name' },
            { field: 'studentEmail', name: 'Student Email' }
        ];

        for (const { field, name } of requiredFields) {
            if (!data[field] || !data[field].trim()) {
                this.showNotification(`${name} is required`, 'error');
                const element = document.getElementById(field);
                if (element) element.focus();
                return false;
            }
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.studentEmail)) {
            this.showNotification('Please enter a valid email address', 'error');
            const element = document.getElementById('studentEmail');
            if (element) element.focus();
            return false;
        }

        return true;
    }

    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Data persistence methods
    saveCertificates() {
        try {
            localStorage.setItem('certificates', JSON.stringify(this.certificates));
        } catch (error) {
            console.error('Failed to save certificates:', error);
        }
    }

    async loadCertificates() {
        try {
            if (!this.currentUser) {
                console.log('No user logged in, cannot load certificates');
                return;
            }

            const response = await this.apiRequest('/api/certificates', 'GET');
            if (response.success) {
                this.certificates = response.certificates;
                this.renderCertificatesTable();
                console.log(`✅ Loaded ${this.certificates.length} certificates`);
            } else {
                console.error('Failed to load certificates:', response.error);
                this.showNotification('Failed to load certificates', 'error');
            }
        } catch (error) {
            console.error('Failed to load certificates:', error);
            this.showNotification('Failed to load certificates', 'error');
        }
    }

    // Refresh only certificate statuses
    async refreshCertificateStatuses() {
        try {
            if (!this.currentUser) {
                console.log('No user logged in, cannot refresh statuses');
                return;
            }

            this.showNotification('Refreshing certificate statuses...', 'info');
            
            const response = await this.apiRequest('/api/certificates', 'GET');
            if (response.success) {
                // Update only the status column in the table
                this.certificates = response.certificates;
                this.updateStatusColumn();
                this.showNotification('Certificate statuses refreshed', 'success');
            } else {
                console.error('Failed to refresh statuses:', response.error);
                this.showNotification('Failed to refresh statuses', 'error');
            }
        } catch (error) {
            console.error('Failed to refresh statuses:', error);
            this.showNotification('Failed to refresh statuses', 'error');
        }
    }

    // Update only the status column in the table
    updateStatusColumn() {
        const tableBody = document.getElementById('certificatesTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const statusCell = row.querySelector('.status-cell');
            if (statusCell && this.certificates[index]) {
                const certificate = this.certificates[index];
                statusCell.innerHTML = `
                    <span class="status-badge status-${certificate.status}">${certificate.status}</span>
                `;
            }
        });
    }

    saveEmailHistory() {
        try {
            localStorage.setItem('emailHistory', JSON.stringify(this.emailHistory));
        } catch (error) {
            console.error('Failed to save email history:', error);
        }
    }

    loadEmailHistory() {
        try {
            const stored = localStorage.getItem('emailHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load email history:', error);
            return [];
        }
    }

    saveVerificationLog() {
        try {
            localStorage.setItem('verificationLog', JSON.stringify(this.verificationLog));
        } catch (error) {
            console.error('Failed to save verification log:', error);
        }
    }

    loadVerificationLog() {
        try {
            const stored = localStorage.getItem('verificationLog');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load verification log:', error);
            return [];
        }
    }

    // Batch Processing Methods
    setupBatchProcessing() {
        const batchModeBtn = document.getElementById('batchModeBtn');
        const singleModeBtn = document.getElementById('singleModeBtn');
        const certificateForm = document.getElementById('certificateForm');
        const batchProcessingCard = document.getElementById('batchProcessingCard');
        const addStudentBtn = document.getElementById('addStudentBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const generateBatchBtn = document.getElementById('generateBatchBtn');
        const uploadCsvBtn = document.getElementById('uploadCsvBtn');
        const csvFile = document.getElementById('csvFile');
        const downloadTemplate = document.getElementById('downloadTemplate');

        // Mode toggle functionality
        if (batchModeBtn) {
            batchModeBtn.addEventListener('click', () => {
                certificateForm.style.display = 'none';
                batchProcessingCard.style.display = 'block';
                batchModeBtn.style.display = 'none';
            });
        }

        if (singleModeBtn) {
            singleModeBtn.addEventListener('click', () => {
                certificateForm.style.display = 'block';
                batchProcessingCard.style.display = 'none';
                batchModeBtn.style.display = 'block';
            });
        }

        // Add student functionality
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', () => {
                this.addStudentToBatch();
            });
        }

        // Clear all students
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllStudents();
            });
        }

        // Generate batch certificates
        if (generateBatchBtn) {
            generateBatchBtn.addEventListener('click', () => {
                this.generateBatchCertificates();
            });
        }

        // CSV upload functionality
        if (uploadCsvBtn) {
            uploadCsvBtn.addEventListener('click', () => {
                this.uploadCsvFile();
            });
        }

        // Download template
        if (downloadTemplate) {
            downloadTemplate.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadCsvTemplate();
            });
        }

        this.batchStudents = [];
        this.updateStudentCount();
    }

    addStudentToBatch() {
        if (this.batchStudents.length >= 50) {
            this.showNotification('Maximum 50 students allowed per batch', 'warning');
            return;
        }

        const studentIndex = this.batchStudents.length + 1;
        const studentDiv = document.createElement('div');
        studentDiv.className = 'batch-student-item';
        studentDiv.innerHTML = `
            <div class="student-header">
                <h5>Student ${studentIndex}</h5>
                <button type="button" class="btn btn--danger btn--sm remove-student" data-index="${this.batchStudents.length}">Remove</button>
            </div>
            <div class="student-fields">
                <div class="form-group">
                    <label class="form-label">Student Name:</label>
                    <input type="text" class="form-control student-name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Parent Name:</label>
                    <input type="text" class="form-control parent-name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">District:</label>
                    <input type="text" class="form-control district" required>
                </div>
                <div class="form-group">
                    <label class="form-label">State:</label>
                    <select class="form-control state" required>
                        <option value="">Select State</option>
                        <option value="MEGHALAYA">MEGHALAYA</option>
                        <option value="ASSAM">ASSAM</option>
                        <option value="WEST BENGAL">WEST BENGAL</option>
                        <option value="DELHI">DELHI</option>
                        <option value="MAHARASHTRA">MAHARASHTRA</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Course Name:</label>
                    <select class="form-control course-name" required>
                        <option value="">Select Course</option>
                        <option value="Certificate Course in Entrepreneurship (CCE)">Certificate Course in Entrepreneurship (CCE)</option>
                        <option value="Digital Marketing Fundamentals">Digital Marketing Fundamentals</option>
                        <option value="Web Development Bootcamp">Web Development Bootcamp</option>
                        <option value="Data Science Essentials">Data Science Essentials</option>
                        <option value="Blockchain Technology">Blockchain Technology</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Student Email:</label>
                    <input type="email" class="form-control student-email" required>
                </div>
            </div>
        `;

        document.getElementById('batchStudentsList').appendChild(studentDiv);

        // Add remove functionality
        const removeBtn = studentDiv.querySelector('.remove-student');
        removeBtn.addEventListener('click', () => {
            const index = parseInt(removeBtn.dataset.index);
            this.removeStudentFromBatch(index);
        });

        this.batchStudents.push({
            studentName: '',
            parentName: '',
            district: '',
            state: '',
            courseName: '',
            studentEmail: ''
        });

        this.updateStudentCount();
    }

    removeStudentFromBatch(index) {
        this.batchStudents.splice(index, 1);
        const studentItems = document.querySelectorAll('.batch-student-item');
        if (studentItems[index]) {
            studentItems[index].remove();
        }
        this.updateStudentCount();
        this.updateStudentIndices();
    }

    updateStudentIndices() {
        const studentItems = document.querySelectorAll('.batch-student-item');
        studentItems.forEach((item, index) => {
            const header = item.querySelector('.student-header h5');
            const removeBtn = item.querySelector('.remove-student');
            header.textContent = `Student ${index + 1}`;
            removeBtn.dataset.index = index;
        });
    }

    clearAllStudents() {
        this.batchStudents = [];
        document.getElementById('batchStudentsList').innerHTML = '';
        this.updateStudentCount();
    }

    updateStudentCount() {
        const countElement = document.getElementById('studentCount');
        const generateBtn = document.getElementById('generateBatchBtn');
        
        if (countElement) {
            countElement.textContent = `${this.batchStudents.length} students added`;
        }
        
        if (generateBtn) {
            generateBtn.disabled = this.batchStudents.length === 0;
        }
    }

    async generateBatchCertificates() {
        // Collect student data from form
        const studentItems = document.querySelectorAll('.batch-student-item');
        const students = [];

        for (let i = 0; i < studentItems.length; i++) {
            const item = studentItems[i];
            const student = {
                studentName: item.querySelector('.student-name').value.trim(),
                parentName: item.querySelector('.parent-name').value.trim(),
                district: item.querySelector('.district').value.trim(),
                state: item.querySelector('.state').value,
                courseName: item.querySelector('.course-name').value,
                studentEmail: item.querySelector('.student-email').value.trim()
            };

            // Validate required fields
            const requiredFields = ['studentName', 'parentName', 'district', 'state', 'courseName', 'studentEmail'];
            const missingFields = requiredFields.filter(field => !student[field]);
            
            if (missingFields.length > 0) {
                this.showNotification(`Student ${i + 1}: Missing required fields: ${missingFields.join(', ')}`, 'error');
                return;
            }

            students.push(student);
        }

        if (students.length === 0) {
            this.showNotification('No students to process', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/certificates/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    students: students,
                    generatedBy: 'Admin'
                })
            });

            const data = await response.json();
            this.showLoading(false);

            if (data.success) {
                this.showBatchResults(data.results);
                this.showNotification(`Batch processing completed: ${data.results.successful.length} successful, ${data.results.failed.length} failed`, 'success');
            } else {
                this.showNotification(data.error || 'Batch processing failed', 'error');
            }

        } catch (error) {
            this.showLoading(false);
            console.error('Batch generation error:', error);
            this.showNotification('Failed to generate batch certificates', 'error');
        }
    }

    showBatchResults(results) {
        const resultsDiv = document.getElementById('batchResults');
        const contentDiv = document.getElementById('batchResultsContent');
        
        let html = `
            <div class="batch-summary">
                <h5>Summary</h5>
                <p><strong>Total:</strong> ${results.total}</p>
                <p><strong>Successful:</strong> ${results.successful.length}</p>
                <p><strong>Failed:</strong> ${results.failed.length}</p>
            </div>
        `;

        if (results.successful.length > 0) {
            html += `
                <div class="successful-results">
                    <h5>✅ Successful Certificates</h5>
                    <div class="results-list">
            `;
            results.successful.forEach(result => {
                html += `
                    <div class="result-item success">
                        <strong>${result.certificateId}</strong> - ${result.studentName} (${result.studentEmail})
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        if (results.failed.length > 0) {
            html += `
                <div class="failed-results">
                    <h5>❌ Failed Certificates</h5>
                    <div class="results-list">
            `;
            results.failed.forEach(result => {
                html += `
                    <div class="result-item error">
                        <strong>Student ${result.index}:</strong> ${result.studentName} - ${result.error}
                    </div>
                `;
            });
            html += `</div></div>`;
        }

        contentDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }

    downloadCsvTemplate() {
        const csvContent = 'Student Name,Parent Name,District,State,Course Name,Student Email\n' +
            'John Doe,Jane Doe,East Khasi Hills,MEGHALAYA,Digital Marketing Fundamentals,john@example.com\n' +
            'Jane Smith,Bob Smith,Guwahati,ASSAM,Web Development Bootcamp,jane@example.com';
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate_batch_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    async uploadCsvFile() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Please select a CSV file', 'warning');
            return;
        }

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                this.showNotification('CSV file must have at least a header and one data row', 'error');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim());
            const requiredHeaders = ['Student Name', 'Parent Name', 'District', 'State', 'Course Name', 'Student Email'];
            
            const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
            if (missingHeaders.length > 0) {
                this.showNotification(`Missing required headers: ${missingHeaders.join(', ')}`, 'error');
                return;
            }

            // Clear existing students
            this.clearAllStudents();

            // Parse CSV data
            for (let i = 1; i < lines.length && i <= 51; i++) { // Max 50 students + header
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 6) {
                    this.addStudentToBatch();
                    const studentItem = document.querySelectorAll('.batch-student-item')[this.batchStudents.length - 1];
                    
                    studentItem.querySelector('.student-name').value = values[0] || '';
                    studentItem.querySelector('.parent-name').value = values[1] || '';
                    studentItem.querySelector('.district').value = values[2] || '';
                    studentItem.querySelector('.state').value = values[3] || '';
                    studentItem.querySelector('.course-name').value = values[4] || '';
                    studentItem.querySelector('.student-email').value = values[5] || '';
                }
            }

            this.showNotification(`Loaded ${this.batchStudents.length} students from CSV`, 'success');
            fileInput.value = '';

        } catch (error) {
            console.error('CSV parsing error:', error);
            this.showNotification('Failed to parse CSV file', 'error');
        }
    }

    // Certificate Revocation Methods
    setupRevocation() {
        const revocationModal = document.getElementById('revocationModal');
        const closeRevocationModal = document.getElementById('closeRevocationModal');
        const cancelRevokeBtn = document.getElementById('cancelRevokeBtn');
        const confirmRevokeBtn = document.getElementById('confirmRevokeBtn');

        if (closeRevocationModal) {
            closeRevocationModal.addEventListener('click', () => {
                this.hideModal('revocationModal');
            });
        }

        if (cancelRevokeBtn) {
            cancelRevokeBtn.addEventListener('click', () => {
                this.hideModal('revocationModal');
            });
        }

        if (confirmRevokeBtn) {
            confirmRevokeBtn.addEventListener('click', () => {
                this.confirmRevokeCertificate();
            });
        }

        // Close modal when clicking outside
        if (revocationModal) {
            revocationModal.addEventListener('click', (e) => {
                if (e.target === revocationModal) {
                    this.hideModal('revocationModal');
                }
            });
        }
    }

    showRevocationModal(certificateId) {
        this.currentRevokingCertificate = certificateId;
        document.getElementById('revocationReason').value = '';
        document.getElementById('revokedBy').value = '';
        this.showModal('revocationModal');
    }

    async confirmRevokeCertificate() {
        const reason = document.getElementById('revocationReason').value.trim();
        const revokedBy = document.getElementById('revokedBy').value.trim();

        if (!reason) {
            this.showNotification('Please enter a revocation reason', 'warning');
            return;
        }

        if (!revokedBy) {
            this.showNotification('Please enter who is revoking the certificate', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/certificates/${this.currentRevokingCertificate}/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    reason: reason,
                    revokedBy: revokedBy
                })
            });

            const data = await response.json();
            this.showLoading(false);

            if (data.success) {
                this.showNotification('Certificate revoked successfully', 'success');
                this.hideModal('revocationModal');
                this.loadCertificates(); // Refresh the certificates list
            } else {
                this.showNotification(data.error || 'Failed to revoke certificate', 'error');
            }

        } catch (error) {
            this.showLoading(false);
            console.error('Revocation error:', error);
            this.showNotification('Failed to revoke certificate', 'error');
        }
    }
}

// Initialize the application when DOM is ready
let app;

function initializeApp() {
    try {
        console.log('Initializing Certificate System...');
        app = new CertificateSystem();
        
        // Make app globally accessible
        window.app = app;
        
        console.log('Certificate System ready');
    } catch (error) {
        console.error('Failed to initialize Certificate System:', error);
        
        // Show error notification after a short delay
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                z-index: 9999;
                font-weight: 500;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            `;
            notification.textContent = 'Application failed to initialize. Please refresh the page.';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 5000);
        }, 1000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
