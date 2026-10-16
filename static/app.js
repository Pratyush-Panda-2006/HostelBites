/**
 * HostelBites Tech-Editorial Client Controller
 * Connects to live FastAPI backend on Render or local proxy
 */

// If deployed on Vercel pointing to Render, set your live Render URL here:
const API_BASE_URL = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
  ? "" 
  : "https://hostelbites.onrender.com";

let currentCookScript = "";

document.addEventListener("DOMContentLoaded", () => {
  initEditorialNav();
  initScrollWordReveal();
  initAuditForm();
  initAudioControls();
});

/* --------------------------------------------------------------------------
   01. Header Navigation Backdrop Transition
   -------------------------------------------------------------------------- */
function initEditorialNav() {
  const nav = document.getElementById("main-nav");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });
}

/* --------------------------------------------------------------------------
   02. Editorial Scroll Word-Reveal
   -------------------------------------------------------------------------- */
function initScrollWordReveal() {
  const container = document.getElementById("reveal-text");
  if (!container) return;

  const rawText = container.innerText.trim();
  const words = rawText.split(/\s+/);
  container.innerHTML = words.map(w => `<span class="reveal-word">${w}</span>`).join(" ");

  const wordSpans = container.querySelectorAll(".reveal-word");

  window.addEventListener("scroll", () => {
    const rect = container.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate progression through the reveal block
    const start = windowHeight * 0.85;
    const end = windowHeight * 0.2;
    const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);

    const activeIndex = Math.floor(progress * wordSpans.length);
    wordSpans.forEach((span, idx) => {
      if (idx <= activeIndex) {
        span.classList.add("active");
      } else {
        span.classList.remove("active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   03. TabPFN Audit Form Submission
   -------------------------------------------------------------------------- */
function initAuditForm() {
  const form = document.getElementById("audit-form");
  const submitBtn = document.getElementById("submit-btn");
  const btnLabel = document.getElementById("btn-label");
  const scanBar = document.getElementById("scan-bar");
  const agentBadge = document.getElementById("agent-state-badge");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // UI state -> Scanning
    btnLabel.innerText = "RUNNING TABPFN & GEMMA 2...";
    submitBtn.disabled = true;
    scanBar.classList.add("active");
    agentBadge.innerText = "SYNTHESIZING";
    agentBadge.style.color = "#3b82f6";

    // Gather payload
    const payload = {
      stall_name: document.getElementById("stall-name").value,
      campus_hub: document.getElementById("campus-hub").value,
      day_of_week: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // Mon=0 .. Sun=6
      is_exam_week: parseInt(document.querySelector('input[name="exam-toggle"]:checked').value),
      is_raining: parseInt(document.querySelector('input[name="rain-toggle"]:checked').value),
      is_weekend: [4, 5].includes(new Date().getDay()) ? 1 : 0,
      leftover_chicken_kg: parseFloat(document.getElementById("chicken-kg").value),
      leftover_paneer_kg: parseFloat(document.getElementById("paneer-kg").value),
      leftover_bread_units: parseInt(document.getElementById("bread-units").value)
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const response = await res.json();
      if (response.status === "success") {
        renderResults(response.data);
      }
    } catch (err) {
      console.error("Audit error:", err);
      // Fallback deterministic local execution for offline or unconfigured states
      renderFallback(payload);
    } finally {
      btnLabel.innerText = "EXECUTE TABPFN AUDIT & FLASH DEALS";
      submitBtn.disabled = false;
      scanBar.classList.remove("active");
      agentBadge.innerText = "SYNTHESIZED";
      agentBadge.style.color = "var(--accent-color)";
    }
  });

  // Copy WhatsApp Broadcast button
  const copyBtn = document.getElementById("copy-btn");
  copyBtn.addEventListener("click", () => {
    const text = document.getElementById("whatsapp-text").innerText;
    navigator.clipboard.writeText(text);
    copyBtn.querySelector(".btn-text").innerText = "COPIED!";
    setTimeout(() => {
      copyBtn.querySelector(".btn-text").innerText = "COPY BROADCAST";
    }, 2000);
  });
}

/* --------------------------------------------------------------------------
   04. Render Active Telemetry & Dispatch Results
   -------------------------------------------------------------------------- */
function renderResults(data) {
  // Telemetry updates
  document.getElementById("telemetry-standby").classList.add("hidden");
  document.getElementById("telemetry-active").classList.remove("hidden");

  const risk = data.risk_analysis.risk_level || "Moderate";
  const pill = document.getElementById("risk-pill");
  pill.innerText = risk;
  pill.className = `risk-pill ${risk.toLowerCase()}`;

  document.getElementById("loss-metric").innerText = `₹${data.risk_analysis.dead_stock_value_inr}`;
  document.getElementById("markdown-data").innerText = `${data.risk_analysis.recommended_markdown_pct}% FLASH REDUCTION`;
  document.getElementById("window-data").innerText = data.risk_analysis.clearance_window;

  // Combos container
  const combosWrapper = document.getElementById("combos-wrapper");
  combosWrapper.innerHTML = "";
  (data.combos || []).forEach(combo => {
    const card = document.createElement("div");
    card.className = "combo-card";
    card.innerHTML = `
      <div class="combo-header">
        <span class="combo-name">${combo.name}</span>
        <span class="combo-savings">${combo.savings}</span>
      </div>
      <p class="combo-items">${combo.items}</p>
      <div class="combo-pricing">
        <span class="flash-price">₹${combo.flash_price}</span>
        <span class="original-price">₹${combo.original_price}</span>
      </div>
    `;
    combosWrapper.appendChild(card);
  });

  // WhatsApp Broadcast
  document.getElementById("whatsapp-text").innerText = data.whatsapp_broadcast;

  // Cook voice script
  currentCookScript = data.cook_audio_script || "Bhai, pehle chicken rolls prepare karo, 1:30 AM tak clear karna hai.";
  document.getElementById("audio-script-preview").innerText = `"${currentCookScript}"`;

  // Reveal dispatch section
  document.getElementById("dispatch").classList.remove("hidden");
  document.getElementById("dispatch").scrollIntoView({ behavior: "smooth" });
}

function renderFallback(payload) {
  const atRisk = Math.round((payload.leftover_chicken_kg * 240) + (payload.leftover_paneer_kg * 380) + (payload.leftover_bread_units * 5));
  renderResults({
    risk_analysis: {
      risk_level: payload.leftover_chicken_kg > 3 ? "High" : "Moderate",
      dead_stock_value_inr: atRisk,
      recommended_markdown_pct: 35,
      clearance_window: "CLEAR BEFORE 1:30 AM (TARGET: 90 MINS)"
    },
    combos: [
      {
        name: "End-Sem All-Nighter Double Roll Combo",
        items: "1x Double Egg Chicken Roll + 1x Thums Up (250ml)",
        original_price: 140,
        flash_price: 89,
        savings: "SAVE ₹51 (36% OFF)"
      },
      {
        name: "Midnight Paneer Burst Paratha Pack",
        items: "2x Butter Paneer Stuffed Parathas + Green Chutney",
        original_price: 160,
        flash_price: 99,
        savings: "SAVE ₹61 (38% OFF)"
      }
    ],
    whatsapp_broadcast: `🚨 *HOSTEL MIDNIGHT HUNGER DROP — ${payload.stall_name.toUpperCase()}* 🚨\n\nStudying late for exams? Don't sleep hungry. Clear stock flash drop live till *1:30 AM*:\n\n🔥 *End-Sem All-Nighter Double Roll* — ₹89 (was ₹140)\n🔥 *Paneer Burst Paratha Pack* — ₹99 (was ₹160)\n\n📍 Deliveries directly to hostel gate.\n📲 Ping here with room no. and order now!`,
    cook_audio_script: "Bhai, pehle chicken paratha aur roll ka masala fry karo, 1:30 AM tak saara stock nikalna hai."
  });
}

/* --------------------------------------------------------------------------
   05. ElevenLabs Audio Streamer
   -------------------------------------------------------------------------- */
function initAudioControls() {
  const playBtn = document.getElementById("play-audio-btn");
  const playLabel = document.getElementById("play-btn-label");
  const audioPlayer = document.getElementById("audio-player");

  playBtn.addEventListener("click", async () => {
    if (!currentCookScript) return;

    playLabel.innerText = "STREAMING AUDIO...";
    playBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentCookScript })
      });

      if (!res.ok) throw new Error("Audio generation failed");

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioPlayer.src = audioUrl;
      audioPlayer.play();

      playLabel.innerText = "PLAYING WALKTHROUGH...";
      audioPlayer.onended = () => {
        playLabel.innerText = "STREAM KITCHEN AUDIO";
        playBtn.disabled = false;
      };
    } catch (err) {
      console.warn("ElevenLabs audio fallback (using browser TTS):", err);
      // Browser SpeechSynthesis fallback if ElevenLabs key is unset
      const utterance = new SpeechSynthesisUtterance(currentCookScript);
      utterance.rate = 0.95;
      utterance.onend = () => {
        playLabel.innerText = "STREAM KITCHEN AUDIO";
        playBtn.disabled = false;
      };
      window.speechSynthesis.speak(utterance);
    }
  });
}
