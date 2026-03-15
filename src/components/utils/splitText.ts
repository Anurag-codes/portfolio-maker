import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "./NativeSplitText";

interface ParaElement extends HTMLElement {
  anim?: gsap.core.Tween;
  split?: SplitText;
}

gsap.registerPlugin(ScrollTrigger);

export default function setSplitText() {
  ScrollTrigger.config({ ignoreMobileResize: true });

  // On mobile, ensure all text is immediately visible without animation
  if (window.innerWidth < 900) {
    document.querySelectorAll<HTMLElement>(".para, .title").forEach((el) => {
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.transform = "none";
    });
    return;
  }

  const paras: NodeListOf<ParaElement> = document.querySelectorAll(".para");
  const titles: NodeListOf<ParaElement> = document.querySelectorAll(".title");

  const TriggerStart = "top 88%";

  paras.forEach((para: ParaElement) => {
    para.classList.add("visible");
    if (para.anim) {
      // Kill the associated ScrollTrigger before killing the tween
      (para.anim.scrollTrigger as ScrollTrigger | undefined)?.kill();
      para.anim.progress(1).kill();
      para.split?.revert();
    }

    para.split = new SplitText(para, {
      type: "lines,words",
      linesClass: "split-line",
    });

    para.anim = gsap.fromTo(
      para.split.words,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: para.parentElement?.parentElement,
          toggleActions: "play none none none",
          start: TriggerStart,
          once: true,
        },
        duration: 0.55,
        ease: "power2.out",
        y: 0,
        stagger: 0.01,
      }
    );
  });
  titles.forEach((title: ParaElement) => {
    if (title.anim) {
      (title.anim.scrollTrigger as ScrollTrigger | undefined)?.kill();
      title.anim.progress(1).kill();
      title.split?.revert();
    }
    title.split = new SplitText(title, {
      type: "chars,lines",
      linesClass: "split-line",
    });
    title.anim = gsap.fromTo(
      title.split.chars,
      { autoAlpha: 0, y: 30, rotate: 8 },
      {
        autoAlpha: 1,
        scrollTrigger: {
          trigger: title.parentElement?.parentElement,
          toggleActions: "play none none none",
          start: TriggerStart,
          once: true,
        },
        duration: 0.45,
        ease: "power2.out",
        y: 0,
        rotate: 0,
        stagger: 0.018,
      }
    );
  });
  // NOTE: No ScrollTrigger "refresh" listener here — the resize handler in
  // MainContainer already calls setSplitText() on resize. Adding a listener
  // here causes exponential growth (each call adds another listener).
}
