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
    // Only select DIRECT child spans (word-level), never nested char spans
    const directSpans = Array.from(el.children).filter(
      (c): c is HTMLSpanElement => c.tagName === "SPAN"
    );
    if (!directSpans.length) return;

    // Measure positions synchronously (before any GSAP transforms are applied)
    const buckets = new Map<number, HTMLSpanElement[]>();
    directSpans.forEach((span) => {
      const top = Math.round(span.getBoundingClientRect().top);
      if (!buckets.has(top)) buckets.set(top, []);
      buckets.get(top)!.push(span);
    });

    // Sort lines top-to-bottom and wrap each group
    const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
    sorted.forEach(([, spans]) => {
      const lineEl = document.createElement("div");
      lineEl.className = linesClass;
      const first = spans[0];
      first.parentNode?.insertBefore(lineEl, first);
      // Collect ALL nodes from first span to last span (inclusive),
      // including text-node spaces between word spans so spacing is preserved
      const lastSpan = spans[spans.length - 1];
      const nodesToMove: ChildNode[] = [];
      let cur: ChildNode | null = first;
      while (cur !== null) {
        nodesToMove.push(cur);
        if (cur === lastSpan) break;
        cur = cur.nextSibling;
      }
      nodesToMove.forEach((n) => lineEl.appendChild(n));
      this.lines.push(lineEl);
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
