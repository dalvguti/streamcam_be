# cPanel WebSocket Setup Guide

## ⚠️ WebSocket Connection Issues on cPanel

If you're experiencing WebSocket connection errors when uploading StreamCam to web hosting, your hosting provider may need special configuration to support WebSockets.

## Common Issue

**Error in browser console:**
```
WebSocket connection to 'wss://yourdomain.com/signal' failed
```

## Solution Options

### Option 1: Contact Hosting Support (Most Common)

Most hosting providers need to enable WebSocket support on their end. Contact support and request:

1. **Enable WebSocket proxy support** in Apache/mod_proxy
2. **Allow WebSocket upgrade headers** for your Node.js application
3. **Configure reverse proxy** to properly handle WebSocket upgrade requests

**What to tell them:**
> "I need to enable WebSockets for my Node.js application running on port [PORT]. Can you enable mod_proxy_wstunnel and configure the proxy to upgrade WebSocket connections from wss://yourdomain.com/signal?"

### Option 2: Add .htaccess Rules (If your hosting allows it)

Create or update `.htaccess` in your public_html or application root:

```apache
# Enable WebSocket support
RewriteEngine On
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule /(.*) ws://localhost:[PORT]/$1 [P,L]
RewriteCond %{HTTP:Upgrade} !=websocket [NC]
RewriteRule /(.*) http://localhost:[PORT]/$1 [P,L]
```

Replace `[PORT]` with your actual Node.js port (usually provided by cPanel).

### Option 3: Use a WebSocket-Enabled Host

Some hosting providers that support WebSockets well:

- **Heroku** - Built-in WebSocket support
- **DigitalOcean App Platform** - WebSocket support included
- **AWS Elastic Beanstalk** - WebSocket configuration available
- **Railway** - WebSocket enabled by default
- **Render** - WebSocket support with upgrade header

### Option 4: Use a WebSocket Proxy Service

For providers that don't support WebSockets, you can use a service like:

- **Cloudflare Workers** - Can proxy WebSocket connections
- **socket.io fallback** - Use polling if WebSockets fail (requires code changes)

## Testing WebSocket Connection

Open browser console on your app and check for:

1. **Connection successful:**
   ```
   WebSocket connection established
   ```

2. **Connection failed:**
   ```
   WebSocket connection to 'wss://...' failed
   ```

## Current Configuration

Your app is already configured correctly:

- ✅ WebSocket endpoint: `/signal`
- ✅ Auto-detects `ws://` vs `wss://` based on protocol
- ✅ Works with HTTP and HTTPS servers
- ✅ No special configuration needed in code

The issue is almost always on the **hosting provider side** requiring:
- mod_proxy_wstunnel enabled
- Proper upgrade header handling
- WebSocket proxy configuration

## Contact Information Template

Use this when contacting your hosting provider:

```
Subject: WebSocket Support Needed for Node.js Application

Hello,

I'm trying to deploy a Node.js application that uses WebSockets
for real-time communication. The WebSocket connection is failing
on wss://mydomain.com/signal.

My application is running on port [PORT].

Could you please:
1. Enable mod_proxy_wstunnel for my domain
2. Configure the reverse proxy to handle WebSocket upgrades
3. Allow WebSocket connections on the /signal path

Thank you!
```

## Alternative: Development Only

If WebSockets don't work on your hosting, you can still run the app locally or use one of the WebSocket-compatible hosts mentioned above.

