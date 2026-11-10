// Noon · a copy version as Markdown, for Claude. The same rules as the app's htmlToMd (js/copy.js): bold and italics as
// ** and * where Markdown allows them and as <strong> / <em> where it would break, underline and highlight as <u> and
// <mark>, nested lists, one blank line between blocks. Plain JavaScript inside, so the same file can be checked in a
// browser; it takes the document to build with (linkedom's here).
const PUNCT = /[!-\/:-@\[-`{-~\u00a1-\u00bf\u2010-\u2027\u2030-\u205e]/;
const isW = (c) => !c || /\s/.test(c);
const isP = (c) => !!c && PUNCT.test(c);
const tagOf = (el) => String(el.tagName || "").toUpperCase();
const mdEsc = (s) => s.replace(/\u00a0/g, " ").replace(/\\/g, "\\\\").replace(/([*_`\[\]<~])/g, "\\$1");

// ** opens when the next character is not a space and, if it is punctuation, the one before is a space or punctuation
// too; it closes the same way round. Spaces just inside the markers go outside them.
function mdWrap(inner, d, tag, prev, next) {
  const m = inner.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
  if (!core) return inner;
  const before = m[1] ? " " : prev, after = m[3] ? " " : next, a = core[0], z = core[core.length - 1];
  const open = !isW(a) && (!isP(a) || isW(before) || isP(before)), close = !isW(z) && (!isP(z) || isW(after) || isP(after));
  return m[1] + (open && close ? d + core + d : `<${tag}>${core}</${tag}>`) + m[3];
}
function mdInline(el) {
  let s = "";
  for (const k of el.childNodes) {
    if (k.nodeType === 3) { s += mdEsc(k.data || k.textContent || ""); continue; }
    if (k.nodeType !== 1) continue;
    const t = tagOf(k);
    if (t === "UL" || t === "OL") continue;
    if (t === "BR") { s += "  \n"; continue; }
    const inner = mdInline(k), prev = ((k.previousSibling && k.previousSibling.textContent) || "").slice(-1), next = ((k.nextSibling && k.nextSibling.textContent) || "").charAt(0);
    if (t === "STRONG" || t === "B") s += mdWrap(inner, "**", "strong", prev, next);
    else if (t === "EM" || t === "I") s += mdWrap(inner, "*", "em", prev, next);
    else if (t === "U") s += inner.trim() ? `<u>${inner}</u>` : inner;
    else if (t === "MARK") s += inner.trim() ? `<mark>${inner}</mark>` : inner;
    else if (t === "A") s += `[${inner}](${(k.getAttribute("href") || "").replace(/[()\s]/g, (c) => encodeURIComponent(c))})`;
    else s += inner;
  }
  return s;
}
const mdLineStart = (s) => s.replace(/^>/, "\\>").replace(/^(#{1,6})(?=\s)/, "\\$1").replace(/^([-+])(?=\s)/, "\\$1").replace(/^(\d+)([.)])(?=\s)/, "$1\\$2").replace(/^([-_=])(?=\1\1)/, "\\$1");
function mdList(el, depth) {
  const ol = tagOf(el) === "OL", pad = "   ".repeat(depth);
  let i = 0;
  return [...el.children].filter((li) => tagOf(li) === "LI").map((li) => {
    i++;
    const subs = [...li.children].filter((c) => tagOf(c) === "UL" || tagOf(c) === "OL"), lead = ol ? `${i}. ` : "- ";
    return pad + lead + mdInline(li).trim().replace(/\n/g, "\n" + pad + " ".repeat(lead.length)) + subs.map((s) => "\n" + mdList(s, depth + 1)).join("");
  }).join("\n");
}
function mdBlock(el) {
  const t = tagOf(el);
  if (/^H[1-6]$/.test(t)) return "#".repeat(Math.min(3, +t[1])) + " " + mdInline(el).trim();
  if (t === "UL" || t === "OL") return mdList(el, 0);
  if (t === "HR") return "---";
  if (t === "BLOCKQUOTE") {
    const inner = el.children.length ? [...el.children].map(mdBlock).filter(Boolean).join("\n\n") : mdInline(el).trim();
    return inner.split("\n").map((l) => (l ? "> " + l : ">")).join("\n");
  }
  if (t === "TABLE") return [...el.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => mdEsc((c.textContent || "").replace(/\s+/g, " ").trim())).join(" | ")).filter(Boolean).join("  \n");
  if (t === "PRE") return (el.textContent || "").split("\n").filter((l) => l.trim()).map((l) => mdLineStart(mdEsc(l))).join("  \n");
  if (t === "DIV" || t === "SECTION" || t === "ARTICLE") return [...el.children].map(mdBlock).filter(Boolean).join("\n\n");
  return mdLineStart(mdInline(el).trim());
}
export function htmlToMarkdown(doc, html) {
  const box = doc.createElement("div");
  box.innerHTML = String(html || "");
  return [...box.children].map(mdBlock).filter(Boolean).join("\n\n") + "\n";
}
// the version's text as words, for counts and for checking whether a suggestion's wording made it in
export function htmlToText(doc, html) {
  const box = doc.createElement("div");
  box.innerHTML = String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<\/(p|h[1-6]|li|blockquote|div|td|th|tr)>/gi, "$& ");
  return (box.textContent || "").replace(/\s+/g, " ").trim();
}
