/// <reference types="vite/client" />

declare module 'gsap-trial/ScrollSmoother' {
  export class ScrollSmoother {
    static create(vars?: Record<string, unknown>): ScrollSmoother;
    static refresh(safe?: boolean): void;
    paused(v: boolean): void;
    scrollTo(target: string | null, animate?: boolean, position?: string): void;
    scrollTop(y: number): void;
  }
}

declare module 'gsap-trial/SplitText' {
  export class SplitText {
    constructor(target: string | Element | (string | Element)[] | NodeList, vars?: Record<string, unknown>);
    chars: Element[];
    words: Element[];
    lines: Element[];
    revert(): void;
    split(vars?: Record<string, unknown>): this;
  }
}
