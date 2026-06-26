const form = document.querySelector("#enquiryForm");
const statusEl = document.querySelector("#formStatus");

document.querySelectorAll("[data-fill-lead]").forEach((button) => {
  button.addEventListener("click", () => {
    const checkbox = document.querySelector('input[name="leadMagnet"]');
    if (checkbox) checkbox.checked = true;
  });
});

if (form && statusEl) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusEl.className = "form-status";
    statusEl.textContent = "Sending enquiry...";

    try {
      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());
      body.pageUrl = window.location.href;
      body.userAgent = navigator.userAgent;

      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const result = await response.json().catch(() => ({
        ok: response.ok,
        message: response.ok ? "Thank you. Your enquiry has been sent." : "Unable to send enquiry."
      }));

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to send enquiry.");
      }

      statusEl.classList.add("success");
      statusEl.textContent = result.message || "Thank you. Your enquiry has been sent.";
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
