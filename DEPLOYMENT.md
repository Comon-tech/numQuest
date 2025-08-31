# 🚀 Deployment Guide for NumQuest Multiplayer

## 🌐 **Deployment Options**

### **Option 1: Render (Recommended - Free Tier)**
**Best for**: Small to medium multiplayer games, free hosting

#### **Step 1: Prepare Your Repository**
1. Ensure all changes are committed to GitHub
2. Make sure `render.yaml` and `package.json` are in your repo

#### **Step 2: Deploy to Render**
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the configuration from `render.yaml`
5. Click "Create Web Service"
6. Wait for deployment (usually 2-5 minutes)

#### **Step 3: Update Client Configuration**
After deployment, update the Socket.IO connection in `resources/js/multiplayer.js`:

```javascript
// Change this line:
this.socket = io('http://localhost:3000', {

// To your Render URL:
this.socket = io('https://your-app-name.onrender.com', {
```

### **Option 2: Railway**
**Best for**: Development and small production apps

#### **Step 1: Deploy to Railway**
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Node.js app
5. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=3000`
6. Deploy and get your URL

### **Option 3: Heroku**
**Best for**: Production apps with scaling needs

#### **Step 1: Deploy to Heroku**
1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Run these commands:
```bash
heroku create your-app-name
git push heroku main
heroku open
```

## 🔧 **Environment Variables**

Set these in your deployment platform:

```bash
NODE_ENV=production
PORT=3000
```

## 📱 **Client-Side Updates**

After deployment, you'll need to update the Socket.IO connection URL in your client code.

### **For Render:**
```javascript
// In resources/js/multiplayer.js
this.socket = io('https://your-app-name.onrender.com', {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
```

### **For Railway:**
```javascript
this.socket = io('https://your-app-name.railway.app', {
    // ... same options
});
```

### **For Heroku:**
```javascript
this.socket = io('https://your-app-name.herokuapp.com', {
    // ... same options
});
```

## 🌍 **Custom Domain (Optional)**

### **With Render:**
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain and follow DNS instructions

### **With Railway:**
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain

## 📊 **Monitoring & Scaling**

### **Free Tier Limits:**
- **Render**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Railway**: $5 credit/month
- **Heroku**: $7/month minimum

### **Scaling Up:**
- **Render**: Upgrade to paid plan for always-on service
- **Railway**: Pay-per-use scaling
- **Heroku**: Add dynos for more capacity

## 🚨 **Important Notes**

1. **Free tiers sleep after inactivity** - first player will experience a delay
2. **WebSocket connections** require HTTPS in production
3. **CORS settings** are already configured for production
4. **Environment variables** are set in the deployment platform

## 🔄 **Auto-Deployment**

All platforms support auto-deployment:
- Push to `main` branch → automatic deployment
- No manual intervention needed
- Easy rollbacks if needed

## 💰 **Cost Comparison**

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Render** | 750h/month | $7+/month | Small games, free hosting |
| **Railway** | $5 credit | Pay-per-use | Development, small apps |
| **Heroku** | None | $7+/month | Production, scaling |
| **DigitalOcean** | None | $5+/month | Full control, scaling |

## 🎯 **Recommendation**

**Start with Render (Free)** → **Scale to paid plan** when you have active players

---

**Need help?** Check the platform's documentation or ask in our Discord!
