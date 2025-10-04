# 🚀 PRODUCTION SETUP GUIDE

## 🔐 **SECURE CREDENTIALS GENERATED**

### **Generated Credentials (Use These)**
```
Admin Password: kYK7s8q#TvJkNc@E
JWT Secret: 94df5ce3048211e7f917ed4b57da46f87f5683a6963eed2fbecad9f6acb64be519d21b729defdee6c71bafd1bb35aea6b9e05bef148448a6ee688638b02ef0d5
Private Key: c12bc403c69b6ad2552eda0c23a84d61f8f7900c49bb77c77ddc798e0d940a1a
```

## 📋 **STEP-BY-STEP SETUP**

### **Step 1: Update Vercel Environment Variables**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `block-certi`
3. **Go to Settings** → **Environment Variables**
4. **Add/Update these variables**:

```bash
# JWT Secret (CRITICAL - Use the generated one)
JWT_SECRET=94df5ce3048211e7f917ed4b57da46f87f5683a6963eed2fbecad9f6acb64be519d21b729defdee6c71bafd1bb35aea6b9e05bef148448a6ee688638b02ef0d5

# Private Key (CRITICAL - Use the generated one)
PRIVATE_KEY=c12bc403c69b6ad2552eda0c23a84d61f8f7900c49bb77c77ddc798e0d940a1a

# Admin Password (CRITICAL - Use the generated one)
ADMIN_PASSWORD=kYK7s8q#TvJkNc@E

# MongoDB URI (Already set)
MONGODB_URI=mongodb+srv://blockchain-admin:<k4J3OB0E8O4pdDVH>@blockchain-certificates.vz6h2fr.mongodb.net/?retryWrites=true&w=majority&appName=blockchain-certificates

# Email Password (Already set)
EMAIL_PASS=bQ7JmB4xE2kUTFqV

# Other existing variables (keep as is)
NODE_ENV=production
BLOCKCHAIN_NETWORK=holesky
BLOCKCHAIN_RPC_URL=https://rpc.ankr.com/eth_holesky
BLOCKCHAIN_NETWORK_ID=17000
BLOCKCHAIN_CHAIN_ID=0x4268
CONTRACT_ADDRESS=0x2dcd685bA9fd46B85849Fac86b908491BC9e0783
GAS_LIMIT=3000000
GAS_PRICE=20000000000
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=9715b5001@smtp-brevo.com
SMTP_FROM=Digital Excellence Institute <otpsender77@gmail.com>
USE_BLOCKCHAIN_FALLBACK=false
INSTITUTE_NAME=Digital Excellence Institute of Technology
INSTITUTE_SUBTITLE=Advancing Digital Skills & Innovation
DIRECTOR_NAME=Dr. Rajesh Kumar
DIRECTOR_TITLE=Director & CEO
```

### **Step 2: Update Local Production Config**

Update your `config.production.env` file with the generated values:

```bash
# JWT Secret (Generated)
JWT_SECRET=94df5ce3048211e7f917ed4b57da46f87f5683a6963eed2fbecad9f6acb64be519d21b729defdee6c71bafd1bb35aea6b9e05bef148448a6ee688638b02ef0d5

# Private Key (Generated)
PRIVATE_KEY=c12bc403c69b6ad2552eda0c23a84d61f8f7900c49bb77c77ddc798e0d940a1a

# Admin Password (Generated)
ADMIN_PASSWORD=kYK7s8q#TvJkNc@E

# MongoDB URI (Your existing)
MONGODB_URI=mongodb+srv://blockchain-admin:<k4J3OB0E8O4pdDVH>@blockchain-certificates.vz6h2fr.mongodb.net/?retryWrites=true&w=majority&appName=blockchain-certificates

# Email Password (Your existing)
EMAIL_PASS=bQ7JmB4xE2kUTFqV
```

### **Step 3: Initialize Secure Admin User**

Run this command to create the secure admin user:

```bash
node scripts/initSecureAdmin.js
```

### **Step 4: Deploy to Production**

```bash
vercel --prod
```

## 🔑 **LOGIN CREDENTIALS FOR PRODUCTION**

### **Admin Login**
- **Username**: `admin`
- **Password**: `kYK7s8q#TvJkNc@E`
- **Email**: `admin@digitalexcellence.edu`

### **Login Process**
1. Go to your production URL
2. Enter username: `admin`
3. Enter password: `kYK7s8q#TvJkNc@E`
4. Connect MetaMask wallet
5. Complete login

## 🌐 **PRODUCTION URLS**

### **Current Production URLs**
- **Main**: https://block-certi-4clvhsmxy-otpsender77-3024s-projects.vercel.app
- **Alias**: https://block-certi-sigma.vercel.app

## ⚠️ **SECURITY CHECKLIST**

### **Before Going Live**
- [ ] ✅ JWT Secret updated in Vercel
- [ ] ✅ Private Key updated in Vercel
- [ ] ✅ Admin Password updated in Vercel
- [ ] ✅ MongoDB URI is correct
- [ ] ✅ Email credentials are working
- [ ] ✅ Test login with new credentials
- [ ] ✅ Verify MetaMask integration works
- [ ] ✅ Test certificate generation

### **After Going Live**
- [ ] Change admin password to something even more secure
- [ ] Monitor login attempts
- [ ] Check server logs for errors
- [ ] Test all functionality

## 🚨 **CRITICAL SECURITY NOTES**

### **Never Share These**
- ❌ JWT Secret
- ❌ Private Key
- ❌ Admin Password
- ❌ MongoDB URI
- ❌ Email Passwords

### **Store Securely**
- ✅ Use a password manager
- ✅ Store in encrypted files
- ✅ Never commit to Git
- ✅ Share only with trusted team members

## 🔧 **TROUBLESHOOTING**

### **If Login Fails**
1. Check Vercel environment variables are set correctly
2. Verify MongoDB connection is working
3. Check server logs for errors
4. Ensure MetaMask is connected

### **If Certificate Generation Fails**
1. Verify blockchain credentials are correct
2. Check contract address is valid
3. Ensure private key has testnet ETH
4. Check email service configuration

## 📞 **SUPPORT**

If you encounter any issues:
1. Check the server logs in Vercel dashboard
2. Verify all environment variables are set
3. Test locally first with the same credentials
4. Contact support if needed

## 🎯 **NEXT STEPS**

1. **Update Vercel environment variables** (Most Important)
2. **Test the production deployment**
3. **Change admin password** after first login
4. **Monitor the system** for any issues
5. **Start using the system** for real certificates

---

**Your system is now ready for production with enterprise-grade security!** 🚀
