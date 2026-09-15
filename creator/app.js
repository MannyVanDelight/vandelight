// Contact form for vandelight.art/creator.
// Screens out bots in the browser (honeypot, minimum fill time, sum puzzle), then
// delivers the message to your inbox through Web3Forms. Web3Forms sets the
// submitted "email" field as reply-to, so replying answers the sender directly.
//
// Setup: request a free access key at https://web3forms.com using the inbox that
// should receive messages, and paste it below. The key is meant to be public;
// it can only deliver to the address it was issued for.
const WEB3FORMS_ACCESS_KEY = "55e6abd7-f534-4e44-bc1c-caa9ac73a7a8";

(() => {
  const form = document.getElementById("contact-form");
  const sent = document.getElementById("contact-sent");
  if (!form || !sent) return;

  const errorEl = form.querySelector("[data-error]");
  const puzzleEl = form.querySelector("[data-puzzle]");
  const button = form.querySelector('button[type="submit"]');
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  const MIN_FILL_MS = 3000;

  const operand = () => 2 + Math.floor(Math.random() * 6);
  const a = operand();
  const b = operand();
  const loadedAt = Date.now();
  let sending = false;

  puzzleEl.textContent = `what is ${a} + ${b}?`;
  button.disabled = false;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function showSent() {
    form.hidden = true;
    sent.hidden = false;
    sent.focus();
  }

  function setSending(on) {
    sending = on;
    button.disabled = on;
    button.textContent = on ? "Sending…" : "Send message";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;

    const data = new FormData(form);
    const field = (name) => String(data.get(name) || "").trim();

    // Honeypot filled: look successful to the bot, send nothing.
    if (field("website")) {
      showSent();
      return;
    }
    if (Date.now() - loadedAt < MIN_FILL_MS) {
      showError("That was too quick — take a moment and send again.");
      return;
    }
    const answer = field("check").toLowerCase();
    if (answer !== String(a + b) && answer !== WORDS[a + b]) {
      showError("Spam check didn't match. Try the sum again.");
      return;
    }
    if (!WEB3FORMS_ACCESS_KEY) {
      console.error("Contact form: set WEB3FORMS_ACCESS_KEY in creator/app.js");
      showError("The form isn't connected yet. Please try again later.");
      return;
    }

    showError("");
    setSending(true);
    let status = 0;
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `vandelight.art/creator: message from ${field("name")}`,
          from_name: "vandelight.art/creator",
          name: field("name"),
          email: field("email"),
          message: field("message"),
        }),
      });
      status = response.status;
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || (result.body && result.body.message) || `HTTP ${status}`);
      }
      showSent();
    } catch (error) {
      console.error("Contact form: delivery failed", error);
      setSending(false);
      showError(status === 429
        ? "Too many messages right now. Please try again in a few minutes."
        : "Couldn't send just now. Check your connection and try again.");
    }
  });
})();

// In-page viewer: plays YouTube videos, shows full images and previews the
// portfolio site in a modal so visitors stay on this page. Only plain clicks
// are intercepted; Ctrl/Cmd/Shift-clicks keep the browser's link behaviour.
(() => {
  const dialog = document.getElementById("viewer");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const stage = dialog.querySelector("[data-viewer-stage]");
  const title = dialog.querySelector("#viewer-title");
  const external = dialog.querySelector("[data-viewer-external]");

  function frame(src, label) {
    const el = document.createElement("iframe");
    el.src = src;
    el.title = label;
    el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    el.allowFullscreen = true;
    return el;
  }

  function open(link) {
    const kind = link.dataset.viewer;
    const label = link.dataset.title || "";
    let media;

    if (kind === "youtube") {
      const id = encodeURIComponent(link.dataset.video);
      media = frame(`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`, label);
      external.textContent = "Watch on YouTube ↗";
    } else if (kind === "image") {
      media = document.createElement("img");
      media.src = link.getAttribute("href");
      media.alt = label;
      external.textContent = "";
    } else {
      media = frame(link.href, label);
      external.textContent = "Open in new tab ↗";
    }

    media.className = "viewer-media";
    dialog.dataset.kind = kind;
    dialog.dataset.orientation = link.dataset.orientation || "";
    title.textContent = label;
    external.href = link.href;
    external.hidden = !external.textContent;
    stage.replaceChildren(media);
    dialog.showModal();
  }

  // Emptying the stage stops any video that is still playing. Do it before
  // closing: the dialog's own "close" event is async and not always delivered.
  function close() {
    stage.replaceChildren();
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("cancel", () => stage.replaceChildren());
  dialog.addEventListener("close", () => stage.replaceChildren());
  dialog.querySelector("[data-viewer-close]").addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close(); // click on the dimmed backdrop
  });
  // Native Escape handling can be skipped by the browser; close explicitly.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      event.preventDefault();
      close();
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-viewer]");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(link);
  });
})();
