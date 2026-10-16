"""HostelBites: Midnight Food Arbitrage Engine - FastAPI Application Entrypoint."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

import sys

# Ensure UTF-8 output encoding across Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from routers.arbitrage import router as arbitrage_router
from services.tabpfn_service import init_tabpfn

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to warm up TabPFN on application startup."""
    print("[HostelBites] Initializing Midnight Food Arbitrage Engine...")
    try:
        init_tabpfn()
        print("[HostelBites] TabPFN Inference Service Ready.")
    except Exception as exc:
        print(f"[HostelBites] TabPFN warm-up warning: {exc}")
    yield
    print("[HostelBites] Shutting down.")


app = FastAPI(
    title="HostelBites: Midnight Food Arbitrage Engine",
    description="Dynamic leftover clearance and viral promo engine for late-night campus food joints.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration allowing all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(arbitrage_router)

# Mount static files at root
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
