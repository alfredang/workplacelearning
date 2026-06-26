const form = document.querySelector("#enquiryForm");
const statusEl = document.querySelector("#formStatus");
const submissionBalloons = document.querySelector("#submissionBalloons");

function launchSubmissionBalloons() {
  if (!submissionBalloons || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = [
    ["#25d366", "#6cf19a"],
    ["#d99a29", "#f2c56e"],
    ["#f24b5d", "#ff8b98"],
    ["#0f5f55", "#35b69f"]
  ];

  submissionBalloons.replaceChildren();

  Array.from({ length: 12 }).forEach((_, index) => {
    const balloon = document.createElement("span");
    const [color, light] = colors[index % colors.length];
    const size = 28 + (index % 4) * 5;
    const left = 8 + ((index * 8) % 86);
    const drift = index % 2 === 0 ? 20 + index * 2 : -22 - index * 2;
    const tilt = index % 2 === 0 ? -8 : 9;
    const duration = 2.6 + (index % 3) * 0.25;

    balloon.className = "submission-balloon";
    balloon.style.setProperty("--balloon-color", color);
    balloon.style.setProperty("--balloon-light", light);
    balloon.style.setProperty("--balloon-size", `${size}px`);
    balloon.style.setProperty("--balloon-left", `${left}%`);
    balloon.style.setProperty("--balloon-drift", `${drift}px`);
    balloon.style.setProperty("--balloon-tilt", `${tilt}deg`);
    balloon.style.setProperty("--balloon-end-tilt", `${tilt * -1}deg`);
    balloon.style.setProperty("--balloon-duration", `${duration}s`);
    balloon.style.animationDelay = `${index * 0.08}s`;
    submissionBalloons.appendChild(balloon);
  });

  window.setTimeout(() => submissionBalloons.replaceChildren(), 3600);
}

document.querySelectorAll("[data-fill-lead]").forEach((button) => {
  button.addEventListener("click", () => {
    const leadMagnet = document.querySelector('[name="leadMagnet"]');
    if (leadMagnet) leadMagnet.value = button.dataset.fillLead;
    const leadMagnetSource = document.querySelector('[name="leadMagnetSource"]');
    if (leadMagnetSource) leadMagnetSource.value = "lead magnet card";
  });
});

if (form && statusEl) {
  const params = new URLSearchParams(window.location.search);
  const attribution = {
    pageUrl: window.location.href,
    referrer: document.referrer,
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmTerm: params.get("utm_term") || "",
    utmContent: params.get("utm_content") || ""
  };

  Object.entries(attribution).forEach(([name, value]) => {
    const input = form.elements[name];
    if (input) input.value = value;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusEl.className = "form-status";
    statusEl.textContent = "Sending enquiry...";

    try {
      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      Object.assign(body, attribution);
      body.userAgent = navigator.userAgent;

      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const result = await response.json().catch(() => ({
        ok: response.ok,
        message: response.ok
          ? "Thank you for your submission, we will get back to you as soon as possible."
          : "Unable to send enquiry."
      }));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to send enquiry.");
      }

      statusEl.classList.add("success");
      statusEl.textContent =
        result.message || "Thank you for your submission, we will get back to you as soon as possible.";
      launchSubmissionBalloons();
      form.reset();
    } catch (error) {
      statusEl.classList.add("error");
      statusEl.textContent =
        error.message || "Unable to send enquiry. Please email or WhatsApp us directly.";
    }
  });
}

(function whatsappWidget() {
  const widget = document.getElementById("waWidget");
  if (!widget) return;

  const phone = "6596983731";
  const launcher = document.getElementById("waLauncher");
  const panel = document.getElementById("waPanel");
  const closeBtn = document.getElementById("waClose");
  const suggestions = document.getElementById("waSuggestions");
  const compose = document.getElementById("waCompose");
  const input = document.getElementById("waInput");

  if (!launcher || !panel) return;

  const openWhatsApp = (message) => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  };

  const openPanel = () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    if (input) input.focus();
  };

  const closePanel = () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };

  launcher.addEventListener("click", () => {
    if (panel.hidden) {
      openPanel();
    } else {
      closePanel();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", closePanel);
  }

  if (suggestions) {
    suggestions.addEventListener("click", (event) => {
      const chip = event.target.closest(".wa-chip");
      if (!chip) return;
      openWhatsApp(chip.textContent.trim());
    });
  }

  if (compose && input) {
    compose.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      openWhatsApp(message);
      input.value = "";
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
})();
