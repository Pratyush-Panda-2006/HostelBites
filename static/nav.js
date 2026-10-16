/**
 * HostelBites Tech-Editorial Navigation & Global State Controller
 * Handles active nav link tracking, glassmorphic backdrop scroll,
 * dynamic local time clock, and shared sessionStorage state.
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initActiveNavTracking();
  initDynamicFooterClock();
});

/* --------------------------------------------------------------------------
   01. Glassmorphic Sticky Transition on Scroll past 20px
   -------------------------------------------------------------------------- */
function initNavbarScroll() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   02. Active Page Tracking & [CURRENT] Micro-Pill Tag
   -------------------------------------------------------------------------- */
function initActiveNavTracking() {
  const path = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") ? link.getAttribute("href").toLowerCase() : "";
    let isMatch = false;

    if (path === "/" || path === "/index.html" || path === "/audit") {
      isMatch = href === "/" || href === "/audit" || href === "/index.html";
    } else if (path.includes("architecture")) {
      isMatch = href.includes("architecture");
    } else if (path.includes("dispatch")) {
      isMatch = href.includes("dispatch");
    } else if (path.includes("audio")) {
      isMatch = href.includes("audio");
    }

    if (isMatch) {
      link.classList.add("active");
      // Add [CURRENT] micro-pill if not already present
      if (!link.querySelector(".current-pill")) {
        const pill = document.createElement("span");
        pill.className = "current-pill";
        pill.innerText = "[CURRENT]";
        link.appendChild(pill);
      }
    } else {
      link.classList.remove("active");
      const existing = link.querySelector(".current-pill");
      if (existing) existing.remove();
    }
  });
}

/* --------------------------------------------------------------------------
   03. Dynamic Local Time Clock in Footer
   -------------------------------------------------------------------------- */
function initDynamicFooterClock() {
  const clockEl = document.getElementById("footer-clock-display");
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    let status = "20:00 KITCHEN CHECK-IN ACTIVE";
    if (now.getHours() >= 20 || now.getHours() < 3) {
      status = "MIDNIGHT ARBITRAGE WINDOW OPEN";
    } else {
      status = "DAY LOGISTICS // 20:00 CHECK-IN STANDBY";
    }

    clockEl.innerText = `${status} // ${hours}:${minutes}:${seconds} IST`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

/* --------------------------------------------------------------------------
   04. Shared SessionStorage State Helpers
   -------------------------------------------------------------------------- */
window.HostelBitesState = {
  getLatestAudit() {
    try {
      const data = sessionStorage.getItem("hostelbites_audit_data");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },
  saveAudit(data) {
    try {
      sessionStorage.setItem("hostelbites_audit_data", JSON.stringify(data));
    } catch (e) {
      console.warn("SessionStorage save failed:", e);
    }
  }
};
