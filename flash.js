// ── Browser compatibility warning ──────────────────────────────────────────
// Web Serial API requires Chrome or Edge. Show a banner for all other browsers.

document.addEventListener('DOMContentLoaded', () => {
  // Skip check when opening locally via file:// (no HTTPS, serial is unavailable regardless)
  const isLocal = location.protocol === 'file:' || location.hostname === 'localhost';
  if (!isLocal && !('serial' in navigator)) {
    document.getElementById('browser-warning').hidden = false;
  }
});

// ── Driver list filter ──────────────────────────────────────────────────────
// Remove driver list items that don't apply to the Waveshare ESP32-S3 (CH343 chip).
// Keeps only "CH342, CH343, CH9102" and hides CP2102 and CH340/CH341 entries.

function filterDriverList(root) {
  root.querySelectorAll('li').forEach(li => {
    const text = li.textContent;
    if (text.includes('CP2102') || text.includes('CH340, CH341')) {
      li.hidden = true;
    }
  });
  // Recurse into any nested shadow roots (e.g. ewt-install-dialog)
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) filterDriverList(el.shadowRoot);
  });
}

function observeRoot(root) {
  filterDriverList(root);
  const mo = new MutationObserver(mutations => {
    filterDriverList(root);
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.shadowRoot) {
          observeRoot(node.shadowRoot);
        }
      });
    });
  });
  mo.observe(root, { childList: true, subtree: true });
}

customElements.whenDefined('esp-web-install-button').then(() => {
  const btn = document.querySelector('esp-web-install-button');
  if (!btn) return;
  const poll = setInterval(() => {
    if (!btn.shadowRoot) return;
    clearInterval(poll);
    observeRoot(btn.shadowRoot);
  }, 50);
});
