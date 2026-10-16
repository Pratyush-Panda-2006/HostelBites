# HostelBites 🌙: Midnight Food Arbitrage Engine

> **Production-ready AI waste prediction & dynamic flash deal engine for late-night college campus food stalls, roll joints, and cloud kitchens.**

---

## ⚡ Overview

Late-night food stalls outside engineering campus gates (such as **ITER / SOA**, **KIIT Food Street**, **Silicon Tech**, and **Manipal**) face a persistent operational challenge: **unpredictable closing surplus**. Unsold chicken, paneer, and breads face morning spoilage and financial write-off.

**HostelBites** solves this by bridging tabular machine learning and generative campus marketing:
1. **The 8:00 PM Kitchen Check**: Takes remaining raw inventory (chicken in kg, paneer in kg, buns/parathas) alongside environmental signals (exam week status, rain, day of the week).
2. **TabPFN Spoilage Inference**: Employs **TabPFN** (CPU Prior-Data Fitted Network) trained on 120 days of campus operational records (`data/midnight_orders.csv`) to predict risk level (`High`, `Moderate`, `Safe`) and compute potential financial exposure at mandi prices (Chicken: ₹220/kg, Paneer: ₹350/kg, Bread: ₹4/unit).
3. **Gemma 2 Viral Copywriting**: Uses **Groq (gemma2-9b-it)** to craft two zero-waste midnight meal combos, a student-targeted WhatsApp broadcast packed with deadline urgency and emojis, and a 2-line Hinglish line cook instruction.
4. **ElevenLabs Line Cook Voice Briefing**: Synthesizes the kitchen instruction using **ElevenLabs Turbo v2.5 (George)**, enabling busy kitchen staff to listen to batch-fry priorities hands-free.
5. **Retro-Memphis UI**: A responsive, neo-brutalist interface built with vanilla HTML5, CSS3, and JavaScript featuring 1-click presets, live financial exposure math, and 1-click WhatsApp copy.

---

## 📁 Repository Structure

```text
HostelBites/
├── data/
│   └── midnight_orders.csv      # 120 days of synthetic campus food operational data
├── services/
│   ├── __init__.py
│   ├── tabpfn_service.py        # TabPFN CPU inference with calibrated ensemble fallback
│   ├── gemma_service.py         # Groq Gemma 2 (gemma2-9b-it) viral deal generator
│   └── voice_service.py         # ElevenLabs Turbo v2.5 voice briefing generator
├── routers/
│   ├── __init__.py
│   └── arbitrage.py             # FastAPI routes (/api/analyze, /api/voice-brief, /api/health)
├── static/
│   ├── index.html               # Memphis neo-brutalist mobile-first UI
│   ├── style.css                # Bold borders, pastel palette, and interactive micro-animations
│   └── app.js                   # Client-side reactivity, exposure calculation, and audio playback
├── main.py                      # FastAPI app entrypoint, lifespan startup, CORS, and static mount
├── requirements.txt             # Python backend dependencies
├── vercel.json                  # Vercel deployment configuration
├── .vercelignore                # Files ignored during Vercel builds
├── .gitignore                   # Git exclusion rules
├── .env                         # Local environment secrets (not committed)
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Clone & Set Up Virtual Environment

```bash
cd HostelBites
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
PORT=8000
# Optional: Set TabPFN token if using PriorLabs TabPFN cloud license
TABPFN_TOKEN=your_tabpfn_token_here
```

*(Note: If API keys are omitted, HostelBites runs in high-fidelity campus fallback mode with local speech synthesis, ensuring 100% testability and zero crashes).*

### 4. Run Locally

```bash
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000` in your browser.

---

## 📡 API Reference

### 1. `POST /api/analyze`
Audits midnight raw inventory, computes financial exposure, predicts spoilage risk via TabPFN, and generates midnight deals via Gemma 2.

**Request Body:**
```json
{
  "stall_name": "Khandagiri Roll Corner",
  "campus_name": "SOA / ITER",
  "chicken_kg": 3.5,
  "paneer_kg": 1.5,
  "bread_units": 25,
  "is_exam_week": 1,
  "is_raining": 0
}
```

**Response (HTTP 200):**
```json
{
  "success": true,
  "stall_name": "Khandagiri Roll Corner",
  "campus_name": "SOA / ITER",
  "timestamp": "2026-10-16T20:23:51.123456",
  "predicted_risk": "Safe",
  "projected_waste_cost_inr": 1395.0,
  "recommended_discount_pct": 15,
  "model_engine": "TabPFN (CPU Prior-Data Fitted Network)",
  "clearance_speed": "Target: Natural Kitchen Close (Low Urgency)",
  "combos": [
    "🔥 Khandagiri Roll Corner Midnight Striker: 1x Jumbo Butter Chicken Roll + Masala Fries @ ₹129",
    "🧀 Backbencher Special: 1x Crispy Paneer Tikka Burger + Cold Beverage @ ₹99"
  ],
  "whatsapp_broadcast": "🚨 *MIDNIGHT CRAVINGS EMERGENCY ALERT* 🚨...",
  "line_cook_instruction": "Bhaiya, sabse pehle 3.5kg chicken aur 1.5kg paneer batch-fry kardo..."
}
```

### 2. `POST /api/voice-brief`
Streams MP3 audio briefing for kitchen staff using ElevenLabs Turbo v2.5 (`George`).

**Request Body:**
```json
{
  "text": "Bhaiya, sabse pehle 3.5kg chicken aur 1.5kg paneer batch-fry kardo."
}
```

**Response:**
- `HTTP 200 audio/mpeg` when `ELEVENLABS_API_KEY` is present.
- `HTTP 204 No Content` with graceful Web Speech API fallback in the frontend when unconfigured.

### 3. `GET /api/health`
Health check endpoint.
```json
{
  "status": "ok",
  "service": "HostelBites"
}
```

---

## ☁️ Deployment

### Deploying Backend to Render
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), create a new **Web Service**.
3. Connect your repository.
4. Set:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. In **Environment Variables**, set:
   - `GROQ_API_KEY`
   - `ELEVENLABS_API_KEY`

### Deploying Frontend to Vercel
HostelBites includes `vercel.json` configured out-of-the-box:
1. Run `vercel` in the project root, or connect the repo to Vercel.
2. The static dashboard in `static/` is served directly with API routes routed to `main.py`.

---

## 📜 License
MIT License. Built for late-night campus food entrepreneurs.
