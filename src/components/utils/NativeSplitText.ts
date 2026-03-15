/**
 * Native SplitText — drop-in replacement for gsap-trial/SplitText.
 * Supports: type "chars", "words", "lines" (any combination), linesClass.
 * API: .chars, .words, .lines, .revert()
 */

interface SplitVars {
  type?: string;
  linesClass?: string;
  charsClass?: string;
  wordsClass?: string;
}

export class SplitText {
  private elements: HTMLElement[] = [];
  private originalHTML: Map<HTMLElement, string> = new Map();
  chars: HTMLElement[] = [];
  words: HTMLElement[] = [];
  lines: HTMLElement[] = [];

  constructor(
    target: string | Element | (string | Element)[] | NodeList,
    vars: SplitVars = {}
  ) {
    // Normalise to a flat array of HTMLElements
    const resolve = (t: string | Element): HTMLElement[] =>
      typeof t === "string"
        ? Array.from(document.querySelectorAll<HTMLElement>(t))
        : [t as HTMLElement];

    if (typeof target === "string" || target instanceof Element) {
      this.elements = resolve(target as string | Element);
    } else if (target instanceof NodeList) {
      this.elements = Array.from(target) as HTMLElement[];
    } else {
      this.elements = (target as (string | Element)[]).flatMap(resolve);
    }

    const types = (vars.type ?? "chars,words")
      .split(",")
      .map((s) => s.trim());
    const linesClass = vars.linesClass ?? "";

    this.elements.forEach((el) => {
      this.originalHTML.set(el, el.innerHTML);
      this._splitElement(el, types, linesClass);
    });
  }

  private _splitElement(el: HTMLElement, types: string[], linesClass: string) {
    const text = el.textContent ?? "";
    el.innerHTML = "";

    // Tokenise: alternate word / whitespace tokens
    const tokens = text.split(/(\s+)/);

    tokens.forEach((token) => {
      // Preserve whitespace as plain text nodes
      if (/^\s+$/.test(token)) {
        el.appendChild(document.createTextNode(token));
        return;
      }

      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";

      if (types.includes("chars")) {
        [...token].forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.style.display = "inline-block";
          charSpan.textContent = char;
          wordSpan.appendChild(charSpan);
          this.chars.push(charSpan);
        });
      } else {
        wordSpan.textContent = token;
      }

      if (types.includes("words")) {
        this.words.push(wordSpan);
      }

      el.appendChild(wordSpan);
    });

    if (types.includes("lines") && linesClass) {
      this._wrapLines(el, linesClass);
    }
  }

  private _wrapLines(el: HTMLElement, linesClass: string) {
    // Use rAF so layout is settled before measuring
    requestAnimationFrame(() => {
      const allSpans = Array.from(el.querySelectorAll<HTMLSpanElement>("span"));
      if (!allSpans.length) return;

      // Group spans by their rounded top Y
      const buckets = new Map<number, HTMLSpanElement[]>();
      allSpans.forEach((span) => {
        const top = Math.round(span.getBoundingClientRect().top);
        if (!buckets.has(top)) buckets.set(top, []);
        buckets.get(top)!.push(span);
      });

      // Wrap each line bucket in an overflow:hidden div
      buckets.forEach((spans) => {
        const lineEl = document.createElement("div");
        lineEl.className = linesClass;
        lineEl.style.overflow = "hidden";
        const first = spans[0];
        first.parentNode?.insertBefore(lineEl, first);
        spans.forEach((s) => lineEl.appendChild(s));
        this.lines.push(lineEl);
      });
    });
  }

  revert() {
    this.elements.forEach((el) => {
      const html = this.originalHTML.get(el);
      if (html !== undefined) el.innerHTML = html;
    });
    this.chars = [];
    this.words = [];
    this.lines = [];
  }
}
