const form = document.querySelector("#enquiryForm");
const statusEl = document.querySelector("#formStatus");
const whatsappToggle = document.querySelector(".whatsapp-toggle");
const whatsappPanel = document.querySelector("#whatsappPanel");

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

if (whatsappToggle && whatsappPanel) {
  whatsappToggle.addEventListener("click", () => {
    const expanded = whatsappToggle.getAttribute("aria-expanded") === "true";
    whatsappToggle.setAttribute("aria-expanded", String(!expanded));
    whatsappPanel.hidden = expanded;
  });
}
