# OutreachOS 🚀
AI-powered outreach and content tool for startups. Built with React + Groq (free AI API).

## Features
- ✨ AI Content Generator (LinkedIn + X posts)
- 👥 Lead Tracker with status management
- ✉️ AI Outreach Message Generator per lead
- 📋 Post History (auto-saved)
- 📅 Content Calendar

## Setup

### 1. Get free Groq API key
- Go to https://console.groq.com
- Sign up → API Keys → Create Key → Copy it

### 2. Install & run locally
```bash
cd outreachos
npm install
copy .env.example .env      # Windows
# OR
cp .env.example .env        # Mac/Linux
```
Open `.env` and replace `your_groq_api_key_here` with your key.

```bash
npm run dev
```
Open http://localhost:5173

### 3. Deploy to Vercel
1. Push this folder to GitHub
2. Go to vercel.com → New Project → Import repo
3. Add Environment Variable: `VITE_GROQ_API_KEY` = your key
4. Click Deploy → get your live URL

---
Built by Shamika · OutreachOS v2.0
