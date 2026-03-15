import { SplitText } from "./NativeSplitText";
import gsap from "gsap";

export function initialFX() {
  document.body.style.overflowY = "auto";
  document.getElementsByTagName("main")[0].classList.add("main-active");
  gsap.to("body", {
    backgroundColor: "#0a0e17",
    duration: 0.5,
    delay: 1,
  });

  var landingText = new SplitText(
    [".landing-info h3", ".landing-intro h2", ".landing-intro h1"],
    {
      type: "chars,lines",
      linesClass: "split-line",
    }
  );
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  let TextProps = { type: "chars,lines", linesClass: "split-h2" };

  var landingText2 = new SplitText(".landing-h2-info", TextProps);
  gsap.fromTo(
    landingText2.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: 1.2,
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: 0.025,
      delay: 0.3,
    }
  );

  gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      y: 0,
      delay: 0.8,
    }
  );
  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power1.inOut",
      delay: 0.1,
    }
  );

  var landingText3 = new SplitText(".landing-h2-info-1", TextProps);
  var landingText4 = new SplitText(".landing-h2-1", TextProps);
  var landingText5 = new SplitText(".landing-h2-2", TextProps);

  LoopText(landingText2, landingText3, ".landing-h2-info-1");
  LoopText(landingText4, landingText5, ".landing-h2-2");
}

function LoopText(Text1: SplitText, Text2: SplitText, text2Selector?: string) {
  const HOLD    = 3.5;
  const DUR     = 0.65;
  const EASE    = "power3.inOut";
  const STAGGER = 0.04;

  // Reveal the Text2 wrapper (CSS opacity:0 prevents initial flash; GSAP must override it)
  if (text2Selector) gsap.set(text2Selector, { opacity: 1 });
  // Text2 chars start hidden below their container — GSAP controls the reveal
  gsap.set(Text2.chars, { y: 80, opacity: 0 });

  // Delay first cycle so Text1's entry animation can finish first
  gsap.delayedCall(1.5, runCycle);

  function runCycle() {
    gsap.timeline()
      // swap 1: Text1 exits up, Text2 slides in from below
      .to(Text1.chars, {
        y: -80, opacity: 0,
        duration: DUR, stagger: STAGGER, ease: EASE,
        delay: HOLD,
      })
      .to(Text2.chars, {
        y: 0, opacity: 1,
        duration: DUR, stagger: STAGGER, ease: EASE,
      }, "<")
      // silently reposition Text1 below, ready for re-entry
      .set(Text1.chars, { y: 80, opacity: 0 })
      // swap 2: Text2 exits up, Text1 slides back in from below
      .to(Text2.chars, {
        y: -80, opacity: 0,
        duration: DUR, stagger: STAGGER, ease: EASE,
        delay: HOLD,
      })
      .to(Text1.chars, {
        y: 0, opacity: 1,
        duration: DUR, stagger: STAGGER, ease: EASE,
      }, "<")
      // silently reposition Text2 below for next cycle
      .set(Text2.chars, { y: 80, opacity: 0 })
      .call(runCycle);
  }
}
