# Deployment & Git Setup Guide

This document provides step-by-step instructions to push this repository to GitHub and deploy both the **Flask Backend** and **React Frontend** to production using Render and Vercel.

---

## Part 1: Push Code to GitHub

Initialize the repository locally, commit all changes, and push it to your GitHub repository:

1. **Initialize Git & Add Files**:
   ```bash
   git init
   git add .
   ```

2. **Commit Changes**:
   ```bash
   git commit -m "chore: optimize configuration and build settings for production deployment"
   ```

3. **Configure Branch and Remote Origin**:
   ```bash
   git branch -m main
   git remote add origin https://github.com/Dharwin77/Voice_Analyzer.git
   ```

4. **Push to Remote**:
   ```bash
   git push -u origin main
   ```

---

## Part 2: Deploy Python Backend on Render

Render will host the Flask API and load scikit-learn and TensorFlow models to perform predictions.

### Option A: Automatic Blueprint Deploy (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** > **Blueprint**.
3. Select your `Voice_Analyzer` repository.
4. Render will parse the `render.yaml` file in your repository root and automatically configure the Web Service backend and static frontend.

### Option B: Manual Deploy
1. Click **New** > **Web Service**.
2. Select your `Voice_Analyzer` repository.
3. Configure the following settings:
   - **Name**: `voice-analyzer-backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --chdir backend app:app`
4. Expand **Advanced** and add the following Environment Variable:
   - `PYTHON_VERSION`: `3.10.0`
5. Click **Deploy Web Service**.
6. Copy the deployed Service URL once the build succeeds (e.g., `https://voice-analyzer-backend.onrender.com`).

---

## Part 3: Deploy React Frontend on Vercel

Vercel will host the React client interface statically for fast page loading.

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** > **Project** and import your `Voice_Analyzer` repository.
3. In the configure project screen:
   - Set **Root Directory** to `speech-analyzer-web`.
   - Vercel will automatically identify the framework as **Vite**.
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE`
   - **Value**: `<YOUR_RENDER_BACKEND_URL>/api` (e.g., `https://voice-analyzer-backend.onrender.com/api`)
5. Click **Deploy**.
