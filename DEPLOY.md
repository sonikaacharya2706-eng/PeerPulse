# Production Deployment Guide: Render + MongoDB Atlas

This guide walks you through deploying the **Smart Campus Solutions** unified platform as an all-in-one web service on **Render** backed by a cloud **MongoDB Atlas** database cluster.

In this architecture, Render serves both the **Node.js/Express API + Socket.io server** and the compiled **React 18 SPA (`/client/dist`)** from a single web service on the same origin. Uploaded images are stored directly in MongoDB as binary buffers, guaranteeing persistence across Render ephemeral container restarts.

---

## 🏗️ Architecture Summary

```text
[Browser / Mobile Client]
          │
          │ HTTPS / WSS (Same Origin)
          ▼
┌───────────────────────────────────────────────┐
│ Render Web Service (Single Instance)          │
│                                               │
│  ├── Express 4 API (/api/*)                   │
│  │     ├── Auth & RBAC Middleware             │
│  │     ├── File Storage Engine (/api/files/*) │
│  │     └── Cron Jobs (SLA & Event Reminders)  │
│  ├── Socket.io Real-time WebSocket Server     │
│  └── Static SPA Hosting (/client/dist)        │
└───────────────────────┬───────────────────────┘
                        │
                        │ TLS Connection
                        ▼
┌───────────────────────────────────────────────┐
│ MongoDB Atlas Cloud Database                  │
│                                               │
│  ├── 14 Application Collections               │
│  └── Files Collection (Binary Image Storage)  │
└───────────────────────────────────────────────┘
```

---

## 1. MongoDB Atlas Setup (Free Cloud Database)

1. **Create an Account / Cluster**:
   - Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
   - Click **Create Deployment** $\rightarrow$ select the **M0 Free Tier** cluster.
   - Choose a cloud provider (AWS/GCP) and a region close to your target audience.

2. **Configure Database User**:
   - Go to **Security** $\rightarrow$ **Database Access**.
   - Click **Add New Database User**.
   - Set **Authentication Method**: Password.
   - Enter a username (e.g., `campus_admin`) and a strong password (e.g., `SecureAtlasPass2026!`).
   - Grant the user **Read and write to any database** privilege.

3. **Configure Network Access**:
   - Go to **Security** $\rightarrow$ **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) since Render uses a dynamic pool of egress IP addresses.
   - Click **Confirm**.

4. **Copy Connection String**:
   - In Atlas, go to **Database** $\rightarrow$ click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the SRV URI. It will look like:
     ```text
     mongodb+srv://campus_admin:<password>@cluster0.abcde.mongodb.net/smart_campus?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password.

---

## 2. Render Web Service Deployment

1. **Create Web Service on Render**:
   - Navigate to the [Render Dashboard](https://dashboard.render.com/) and sign in.
   - Click **New +** $\rightarrow$ select **Web Service**.
   - Connect your GitHub / GitLab repository containing this project.

2. **Configure Service Settings**:
   - **Name**: `smart-campus` (or any custom identifier)
   - **Language**: `Node`
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses repository root)
   - **Build Command**:
     ```bash
     npm run install:all && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Instance Type**: `Free`

3. **Environment Variables on Render**:
   In the **Environment** tab of your Render service, add the following variables:

   Alternatively, deploy from the repository root with [render.yaml](render.yaml).
   It generates a secure `JWT_SECRET` automatically and prompts for `MONGO_URI`
   and `CLIENT_URL` where applicable.

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables Express production mode & static SPA serving |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `replace_with_a_secure_random_64_char_hex_key` | Secret key for signing authentication tokens |
   | `JWT_EXPIRES` | `1d` | Token validity duration |
   | `VITE_API_URL` | `/api` | Relative API path (same origin, eliminates CORS) |
   | `CLIENT_URL` | `https://<your-app-name>.onrender.com` | Your public Render domain |
   | `SMTP_HOST` | *(Optional)* | Custom SMTP server hostname (if omitted, logs to console) |
   | `SMTP_PORT` | `587` | *(Optional)* SMTP port |
   | `SMTP_USER` | *(Optional)* | *(Optional)* SMTP username |
   | `SMTP_PASS` | *(Optional)* | *(Optional)* SMTP password |
   | `MAIL_FROM` | `"Smart Campus" <no-reply@campus.edu>` | Outbound sender format |

4. **Click Create Web Service**:
   Render will clone your repository, install server and client dependencies, build the React bundle into `client/dist`, and launch the unified HTTP and Socket.io server with `node server/index.js`.

---

## 3. Database Seeding (Atlas Remote Database)

The database seed script is **safe to run once**—it automatically detects existing data to prevent accidental production overwrites.

### Option A: Seed via Render Shell (Recommended)
1. In the Render Dashboard, open your deployed Web Service.
2. Click on the **Shell** tab in the sidebar.
3. Run:
   ```bash
   npm run seed
   ```
4. If you ever need to reset or overwrite the database, pass `--force`:
   ```bash
   npm run seed -- --force
   ```

### Option B: Seed from your Local Terminal
You can seed Atlas directly from your development machine:
```bash
# Windows PowerShell
$env:MONGO_URI="mongodb+srv://campus_admin:password@cluster0.abcde.mongodb.net/smart_campus?retryWrites=true&w=majority"; npm run seed

# Linux / macOS Bash
MONGO_URI="mongodb+srv://campus_admin:password@cluster0.abcde.mongodb.net/smart_campus?retryWrites=true&w=majority" npm run seed
```

---

## 4. Post-Deployment Verification Checklist

Verify your production deployment against these key health checkpoints:

1. **Health Check Endpoint**:
   Open in your browser:
   ```text
   https://<your-app-name>.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-11-14T...",
     "uptime": 45,
     "service": "smart-campus-api"
   }
   ```

2. **Web Application & SPA Routing**:
   - Visit `https://<your-app-name>.onrender.com/` $\rightarrow$ Landing page renders cleanly.
   - Navigate to `/login` $\rightarrow$ Use the quick-fill buttons and enter the password configured when the demo accounts were seeded.
   - Refresh the page while on `/dashboard` or `/m1/rooms/status` $\rightarrow$ Express SPA fallback serves `index.html` without 404 errors.

3. **WebSocket Real-Time Sync**:
   - Log in as faculty on one browser window (`faculty1@campus.edu`) and open **Start Class (QR Live)**.
   - Log in as student on another browser window (`student1@campus.edu`) and mark attendance.
   - Verify student check-in appears in real time without refreshing.

4. **Persistent Image Uploads**:
   - Report a lost item with photo attachments under **M2. Digital Lost-and-Found**.
   - Verify the image URL format is `/api/files/:id`.
   - The photo is stored as a binary buffer inside MongoDB Atlas and will never disappear when Render restarts.

---

## 5. Free Hosting Maintenance Notes

- **Spin-down Behavior**: On Render's free tier, services spin down after 15 minutes of inactivity. The first request after a sleep period may take ~30–50 seconds to boot up.
- **Uptime Monitoring**: You can set up a free uptime monitor (e.g., [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/)) pinging `https://<your-app-name>.onrender.com/api/health` every 10 minutes to prevent the service from sleeping.
