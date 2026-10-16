/**
 * HostelBites Tech-Editorial Client Controller (Audit Engine)
 * Connects to live FastAPI backend on Render or local proxy
 */

const API_BASE_URL = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
  ? "" 
  : "https://hostelbites.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initScrollWordReveal();
  initAuditForm();
});

/* --------------------------------------------------------------------------
   01. Editorial Scroll Word-Reveal
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
   02. TabPFN Audit Form Submission
   -------------------------------------------------------------------------- */
function initAuditForm() {
  const form = document.getElementById("audit-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const btnLabel = document.getElementById("btn-label");
  const scanBar = document.getElementById("scan-bar");
  const agentBadge = document.getElementById("agent-state-badge");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // UI state -> Scanning
    btnLabel.innerText = "RUNNING TABPFN & GEMMA 2...";
    submitBtn.disabled = true;
    if (scanBar) scanBar.classList.add("active");
    if (agentBadge) {
      agentBadge.innerText = "SYNTHESIZING";
      agentBadge.style.color = "#3b82f6";
    }

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
      renderFallback(payload);
    } finally {
      btnLabel.innerText = "EXECUTE TABPFN AUDIT & FLASH DEALS";
      submitBtn.disabled = false;
      if (scanBar) scanBar.classList.remove("active");
      if (agentBadge) {
        agentBadge.innerText = "SYNTHESIZED";
        agentBadge.style.color = "var(--accent-color)";
      }
    }
  });
}

/* --------------------------------------------------------------------------
   03. Render Active Telemetry & Persist State
   -------------------------------------------------------------------------- */
function renderResults(data) {
  // Persist to shared sessionStorage for /dispatch and /audio pages
  if (window.HostelBitesState) {
    window.HostelBitesState.saveAudit(data);
  }

  // Telemetry updates
  const standby = document.getElementById("telemetry-standby");
  const active = document.getElementById("telemetry-active");
  if (standby) standby.classList.add("hidden");
  if (active) active.classList.remove("hidden");

  const risk = (data.risk_analysis && data.risk_analysis.risk_level) || "Moderate";
  const pill = document.getElementById("risk-pill");
  if (pill) {
    pill.innerText = risk;
    pill.className = `risk-pill ${risk.toLowerCase()}`;
  }

  const lossMetric = document.getElementById("loss-metric");
  if (lossMetric) {
    lossMetric.innerText = `₹${data.risk_analysis.dead_stock_value_inr}`;
  }

  const markdownData = document.getElementById("markdown-data");
  if (markdownData) {
    markdownData.innerText = `${data.risk_analysis.recommended_markdown_pct}% FLASH REDUCTION`;
  }

  const windowData = document.getElementById("window-data");
  if (windowData) {
    windowData.innerText = data.risk_analysis.clearance_window;
  }
}

function renderFallback(payload) {
  const atRisk = Math.round((payload.leftover_chicken_kg * 220) + (payload.leftover_paneer_kg * 350) + (payload.leftover_bread_units * 4));
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
    cook_audio_script: "Bhaiya, pehle chicken paratha aur roll ka masala fry karo, 1:30 AM tak saara stock nikalna hai."
  });
}
