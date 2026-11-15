(function() {
if (window.__i18nCoreLoaded) return;
window.__i18nCoreLoaded = true;

const SKIP_SELECTOR = [
  "script", "style", "code", "pre", "kbd", "textarea", "input", "samp",
  "[aria-hidden='true']", "[translate='no']", ".notranslate",
  "[contenteditable='true']",
  ".markdown-body", "[data-testid='markdown-body']", ".react-markdown",
  ".markdown-title", ".js-issue-title",
  ".comment-body", ".js-comment-body",
  ".commit-title", ".commit-desc", ".js-commit-title", ".js-commit-message",
  ".blob-code", ".blob-wrapper", ".js-file-line",
  ".react-code-lines", ".react-code-line", ".react-code-text", ".react-file-content",
  ".diff-view", ".js-diff-table", ".diff-table",
  ".code-list", ".code-list-item",
  ".highlight", ".ProseMirror", ".CodeMirror", ".cm-editor"
].join(", ");

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ENTRIES = Object.entries(I18N)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([en, zh]) => [en, new RegExp("(?<![A-Za-z0-9])" + escapeRegExp(en) + "(?![A-Za-z0-9])", "g"), zh]);

function shouldSkip(node) {
  let el = node.parentElement;
  while (el) {
    if (el.matches && el.matches(SKIP_SELECTOR)) return true;
    el = el.parentElement;
  }
  return false;
}

function translateText(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;

  if (I18N[trimmed]) return I18N[trimmed];

  let result = text;
  for (const [en, re, zh] of ENTRIES) {
    if (result.includes(en)) result = result.replace(re, zh);
  }
  return result;
}

function translateNode(node) {
  const before = node.nodeValue;
  const after = translateText(before);
  if (after !== before) node.nodeValue = after;
}

function walk(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.nodeValue && root.nodeValue.trim() && !shouldSkip(root)) translateNode(root);
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node;
  while ((node = walker.nextNode())) {
    translateNode(node);
  }
}

walk(document.documentElement);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === "characterData") {
      const t = mutation.target;
      if (t && t.nodeType === Node.TEXT_NODE && t.nodeValue && t.nodeValue.trim() && !shouldSkip(t)) {
        translateNode(t);
      }
      continue;
    }
    for (const added of mutation.addedNodes) {
      if (added.nodeType === Node.ELEMENT_NODE || added.nodeType === Node.TEXT_NODE) {
        walk(added);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});

})();
