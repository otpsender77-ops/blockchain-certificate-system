# Render Deployment Guide

## Backend Deployment to Render

This guide will help you deploy the blockchain certificate system backend to Render.

### Prerequisites

1. **Render Account**: Sign up at https://render.com
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Database**: Vercel database is already configured

### Deployment Steps

#### Step 1: Connect GitHub Repository

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the repository: `otpsender77-ops/blockchain-certificate-system`

#### Step 2: Configure Service

**Basic Settings:**
- **Name**: `blockchain-certificate-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `master`
- **Root Directory**: Leave empty (root)
- **Runtime**: `Node 20.x`
- **Build Command**: `npm install --omit=dev --no-audit --no-fund --prefer-offline`
- **Start Command**: `node server.js`

#### Step 3: Environment Variables

Add the following environment variables in Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://Vercel-Admin-bcs:FUtfJOCDi0LY3SZi@bcs.prwsuo6.mongodb.net/?retryWrites=true&w=majority&appName=bcs
JWT_SECRET=94df5ce3048211e7f917ed4b57da46f87f5683a6963eed2fbecad9f6acb64be519d21b729defdee6c71bafd1bb35aea6b9e05bef148448a6ee688638b02ef0d5
JWT_EXPIRES_IN=24h
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=9715b5001@smtp-brevo.com
EMAIL_PASS=bQ7JmB4xE2kUTFqV
SMTP_FROM=Digital Excellence Institute <otpsender77@gmail.com>
PINATA_API_KEY=4d4c23ad6fc7594b49da
PINATA_SECRET_KEY=ae6734648d4343fd699db2f3941c45e3e285f0a8c108013d9b8f83b9f54323f4
PRIVATE_KEY=8e4d8d9b1437534cd90f705f8e6f253d40a3df3f30f3489aa5ec761da10e23bd
RPC_URL=https://rpc.ankr.com/eth_holesky
CONTRACT_ADDRESS=0x2dcd685bA9fd46B85849Fac86b908491BC9e0783
ADMIN_USERNAME=admin
ADMIN_PASSWORD=AdminUser@Blockchain123#
ADMIN_EMAIL=otpsender77@gmail.com
SESSION_SECRET=cce7411f54898f50bec5aee9b4fbe47e9f130c1d697301adb4c82076cc46cd1f4b88df1716eb89e5395bd90dd3478dd1bec746ff0c47ca84fc06fdf3e6ccdac6
ENCRYPTION_KEY=99ab05d86cc1218ad396f70b532bfb952493c5cb0e6fe93da7fa55ce6a8fa609
```

#### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete (5-10 minutes)
3. Note the service URL (e.g., `https://blockchain-certificate-backend.onrender.com`)

### Testing the Deployment

#### Test API Health
```bash
curl https://your-service-url.onrender.com/api/health
```

#### Test Login
```bash
curl -X POST https://your-service-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminUser@Blockchain123#"}'
```

### Frontend Configuration

After backend deployment, update the frontend to use the Render backend:

1. **Update API Base URL** in `public/app.js`:
   ```javascript
   this.apiBaseUrl = 'https://your-service-url.onrender.com/api';
   ```

2. **Update CORS** in `server.js` to include Render URL

3. **Redeploy Frontend** to Vercel

### Advantages of Render

- ✅ **Persistent Connections**: Better for database connections
- ✅ **No Cold Starts**: Always running
- ✅ **Better Performance**: For database-heavy operations
- ✅ **Easier Debugging**: Full server logs
- ✅ **Free Tier**: Available for testing

### Troubleshooting

#### Common Build Issues

1. **"npm install" gets stuck**: 
   - **Cause**: Render's free build container (512 MB RAM) runs out of memory
   - **Solution**: Use optimized npm flags (already configured) or remove heavy dependencies

2. **Out of Memory (OOM) errors**:
   - **Look for**: `Killed` or `npm ERR! code 137` in logs
   - **Solution**: 
     - Use `--omit=dev` flag (already configured)
     - Remove heavy deps like `puppeteer` if not essential
     - Consider upgrading to paid plan for more memory

3. **Node version mismatch**:
   - **Solution**: Explicitly set Node 20.x in package.json (already configured)

4. **Large dependencies**:
   - **Heavy deps**: `puppeteer`, `canvas`, `ethers`, `ipfs-http-client`
   - **Solution**: Use optimized npm flags (already configured) or consider alternatives

5. **Database Connection**: Verify MongoDB URI and network access
6. **Environment Variables**: Ensure all required variables are set
7. **Logs**: Check Render dashboard logs for specific errors

### Next Steps

1. Deploy backend to Render
2. Test API endpoints
3. Update frontend to use Render backend
4. Test complete system functionality
