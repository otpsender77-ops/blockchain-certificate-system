# 🚀 Deployment Guide

This guide will help you deploy the Blockchain Certificate System to Vercel (Frontend) and Render (Backend).

## 📋 Prerequisites

- GitHub account
- Vercel account
- Render account
- MongoDB Atlas account
- Pinata account (for IPFS)

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Repository
1. Push your code to GitHub
2. Ensure all files are committed

### Step 2: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`

### Step 3: Environment Variables
Add these environment variables in Vercel:
- `NODE_ENV`: `production`
- `REACT_APP_API_URL`: `https://your-render-app.onrender.com/api`

### Step 4: Deploy
Click "Deploy" and wait for deployment to complete.

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Repository
Ensure your repository has:
- `package.json` with correct start script
- `server.production.js` for production
- `render.yaml` for configuration

### Step 2: Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `blockchain-certificate-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Environment Variables
Add all environment variables from `render.yaml` or manually:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `MONGODB_URI`: Your Atlas connection string
- `JWT_SECRET`: Your JWT secret
- `PINATA_API_KEY`: Your Pinata API key
- `PINATA_SECRET_KEY`: Your Pinata secret key
- `EMAIL_USER`: Your email service user
- `EMAIL_PASS`: Your email service password
- `PRIVATE_KEY`: Your blockchain private key
- And all other variables from `config.production.env`

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

## 🔗 Connecting Frontend to Backend

### Update Frontend API URL
In `public/app.js`, update the API base URL:
```javascript
this.apiBaseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-render-app.onrender.com/api'
    : window.location.origin + '/api';
```

### CORS Configuration
Ensure your Render backend allows requests from your Vercel frontend domain.

## 🧪 Testing Deployment

### Frontend Tests
1. Visit your Vercel URL
2. Test login functionality
3. Test certificate generation
4. Test verification portal

### Backend Tests
1. Test health endpoint: `https://your-render-app.onrender.com/api/health`
2. Test verification: `https://your-render-app.onrender.com/api/verification/certificate-id`
3. Check logs in Render dashboard

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in `server.production.js`
   - Ensure frontend URL is whitelisted

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in Atlas

3. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match exactly

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in `package.json`

### Logs
- **Vercel**: Check function logs in dashboard
- **Render**: Check service logs in dashboard

## 📊 Monitoring

### Vercel
- Monitor function executions
- Check performance metrics
- Set up alerts for errors

### Render
- Monitor service health
- Check resource usage
- Set up uptime monitoring

## 🔄 Updates

### Frontend Updates
1. Push changes to GitHub
2. Vercel automatically redeploys

### Backend Updates
1. Push changes to GitHub
2. Render automatically redeploys
3. Check logs for any issues

## 🛡️ Security Considerations

1. **Environment Variables**
   - Never commit sensitive data
   - Use strong, unique secrets
   - Rotate keys regularly

2. **Database Security**
   - Use strong passwords
   - Enable IP whitelisting
   - Enable authentication

3. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs

## 📈 Performance Optimization

1. **Frontend**
   - Enable Vercel's CDN
   - Optimize images
   - Minimize bundle size

2. **Backend**
   - Use connection pooling
   - Implement caching
   - Monitor resource usage

## 🆘 Support

If you encounter issues:
1. Check the logs first
2. Verify environment variables
3. Test locally with production config
4. Check service status pages

---

**🎉 Your Blockchain Certificate System is now live!**