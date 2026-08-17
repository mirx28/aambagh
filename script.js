import { vertexShader, fragmentShader } from "./shaders.js";
import projectSlides from "./slides.js";

// Libraries loaded via CDN <script> tags (index.html) — globals on window
const THREE = window.THREE;
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const SplitText = window.SplitText;
const CustomEase = window.CustomEase;
const Lenis = window.Lenis;

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

// ============ SHARED LENIS INSTANCE ============
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);

/* ===================================================================
   PRELOADER + HERO REVEAL
   =================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const tl = gsap.timeline({
    delay: 0.3,
    defaults: {
      ease: "hop",
    },
  });

  const counts = document.querySelectorAll(".count");

  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".digit h1");

    tl.to(
      digits,
      {
        y: "0%",
        duration: 1,
        stagger: 0.075,
      },
      index * 1
    );

    if (index < counts.length) {
      tl.to(
        digits,
        {
          y: "-100%",
          duration: 1,
          stagger: 0.075,
        },
        index * 1 + 1
      );
    }
  });

  tl.to(".spinner", {
    opacity: 0,
    duration: 0.3,
  });

  tl.to(
    ".word h1",
    {
      y: "0%",
      duration: 1,
    },
    "<"
  );

  tl.to(".divider", {
    scaleY: "100%",
    duration: 1,
    onComplete: () =>
      gsap.to(".divider", { opacity: 0, duration: 0.3, delay: 0.3 }),
  });

  tl.to("#word-1 h1", {
    y: "100%",
    duration: 1,
    delay: 0.3,
  });

  tl.to(
    "#word-2 h1",
    {
      y: "-100%",
      duration: 1,
    },
    "<"
  );

  tl.to(
    ".block",
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 1,
      stagger: 0.1,
      delay: 0.75,
      onStart: () =>
        gsap.to(".hero-img", { scale: 1, duration: 2, ease: "hop" }),
    },
    "<"
  );

  tl.to(
    [".nav", ".line h1", ".line p"],
    {
      y: "0%",
      duration: 1.5,
      stagger: 0.2,
    },
    "<"
  );

  tl.to(
    [".cta", ".cta-icon"],
    {
      scale: 1,
      duration: 1.5,
      stagger: 0.75,
      delay: 0.75,
    },
    "<"
  );

  tl.to(
    ".cta-label p",
    {
      y: "0%",
      duration: 1.5,
      delay: 0.5,
    },
    "<"
  );

  tl.to(
    ".loader",
    {
      opacity: 0,
      duration: 0.35,
      onComplete: () => {
        const loader = document.querySelector(".loader");
        if (loader) {
          loader.style.pointerEvents = "none";
          loader.style.display = "none";
        }
      },
    },
    "+=0.2"
  );

  /* ============ CTA → SCROLL TO IRONHILL SECTION ============ */
  const ctaBtn = document.getElementById("ctaBtn");
  const ihHeroSection = document.getElementById("ihHero");

  if (ctaBtn && ihHeroSection) {
    ctaBtn.addEventListener("click", () => {
      lenis.scrollTo(ihHeroSection, { offset: 0, duration: 1.5 });
    });
  }
});

/* ===================================================================
   IRONHILL — WEBGL DISPLACEMENT HERO
   =================================================================== */
const CONFIG = {
  color: "#ebf5df",
  spread: 0.5,
  speed: 2,
};

const ihCanvas = document.querySelector(".ih-hero-canvas");
const ihHero = document.querySelector(".ih-hero");

const ihScene = new THREE.Scene();
const ihCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const ihRenderer = new THREE.WebGLRenderer({
  canvas: ihCanvas,
  alpha: true,
  antialias: false,
});

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.89, g: 0.89, b: 0.89 };
}

function resizeIhCanvas() {
  const width = ihHero.offsetWidth;
  const height = ihHero.offsetHeight;
  ihRenderer.setSize(width, height);
  ihRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

resizeIhCanvas();
window.addEventListener("resize", resizeIhCanvas);

const ihRgb = hexToRgb(CONFIG.color);
const ihGeometry = new THREE.PlaneGeometry(2, 2);
const ihMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uProgress: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(ihHero.offsetWidth, ihHero.offsetHeight),
    },
    uColor: { value: new THREE.Vector3(ihRgb.r, ihRgb.g, ihRgb.b) },
    uSpread: { value: CONFIG.spread },
  },
  transparent: true,
});

const ihMesh = new THREE.Mesh(ihGeometry, ihMaterial);
ihScene.add(ihMesh);

let ihScrollProgress = 0;

function animateIh() {
  ihMaterial.uniforms.uProgress.value = ihScrollProgress;
  ihRenderer.render(ihScene, ihCamera);
  requestAnimationFrame(animateIh);
}

animateIh();

lenis.on("scroll", ({ scroll }) => {
  const heroTop = ihHero.offsetTop;
  const heroHeight = ihHero.offsetHeight;
  const windowHeight = window.innerHeight;
  const maxScroll = heroHeight - windowHeight;
  const relativeScroll = scroll - heroTop;
  ihScrollProgress = Math.min(
    Math.max((relativeScroll / maxScroll) * CONFIG.speed, 0),
    1.1
  );
});

window.addEventListener("resize", () => {
  ihMaterial.uniforms.uResolution.value.set(
    ihHero.offsetWidth,
    ihHero.offsetHeight
  );
});

const ihHeroH2 = document.querySelector(".ih-hero-content h2");
const ihSplit = new SplitText(ihHeroH2, { type: "words" });
const ihWords = ihSplit.words;

gsap.set(ihWords, { opacity: 0 });

ScrollTrigger.create({
  trigger: ".ih-hero-content",
  start: "top 25%",
  end: "bottom 100%",
  onUpdate: (self) => {
    const progress = self.progress;
    const totalWords = ihWords.length;

    ihWords.forEach((word, index) => {
      const wordProgress = index / totalWords;
      const nextWordProgress = (index + 1) / totalWords;

      let opacity = 0;

      if (progress >= nextWordProgress) {
        opacity = 1;
      } else if (progress >= wordProgress) {
        const fadeProgress =
          (progress - wordProgress) / (nextWordProgress - wordProgress);
        opacity = fadeProgress;
      }

      gsap.to(word, {
        opacity: opacity,
        duration: 0.1,
        overwrite: true,
      });
    });
  },
});

/* ===================================================================
   PROJECT SLIDER — activates only once fully scrolled into view
   =================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const totalPsSlides = projectSlides.length;
  let psCurrentSlide = 1;

  let psIsAnimating = false;
  let psScrollAllowed = true;
  let psLastScrollTime = 0;
  let psActive = false;

  const psWrapper = document.getElementById("psWrapper");
  const psSlider = document.getElementById("psSlider");

  document.querySelectorAll(".ps-slide-link a").forEach((link) => {
    link.href = "walkthrough.html";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "walkthrough.html";
    });
  });

  function createPsSlide(slideIndex) {
    const slideData = projectSlides[slideIndex - 1];

    const slide = document.createElement("div");
    slide.className = "ps-slide";

    const slideImg = document.createElement("div");
    slideImg.className = "ps-slide-img";
    const img = document.createElement("img");
    img.src = slideData.slideImg;
    img.alt = "";
    slideImg.appendChild(img);
    slide.appendChild(slideImg);

    if (slideIndex === 1) {
      const slideHeader = document.createElement("div");
      slideHeader.className = "ps-slide-header";

      const slideTitle = document.createElement("div");
      slideTitle.className = "ps-slide-title";
      const h1 = document.createElement("h1");
      h1.textContent = slideData.slideTitle;
      slideTitle.appendChild(h1);

      const slideDescription = document.createElement("div");
      slideDescription.className = "ps-slide-description";
      const p = document.createElement("p");
      p.textContent = slideData.slideDescription;
      slideDescription.appendChild(p);

      const slideLink = document.createElement("div");
      slideLink.className = "ps-slide-link";
      const a = document.createElement("a");
      a.href = "walkthrough.html";
      a.textContent = "View Project";
      a.setAttribute("rel", "noopener noreferrer");
      a.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "walkthrough.html";
      });
      slideLink.appendChild(a);

      slideHeader.appendChild(slideTitle);
      slideHeader.appendChild(slideDescription);
      slideHeader.appendChild(slideLink);
      slide.appendChild(slideHeader);

      const slideInfo = document.createElement("div");
      slideInfo.className = "ps-slide-info";

      const slideTags = document.createElement("div");
      slideTags.className = "ps-slide-tags";
      const tagsLabel = document.createElement("p");
      tagsLabel.textContent = "Tags";
      slideTags.appendChild(tagsLabel);

      slideData.slideTags.forEach((tag) => {
        const tagP = document.createElement("p");
        tagP.textContent = tag;
        slideTags.appendChild(tagP);
      });

      const slideIndexWrapper = document.createElement("div");
      slideIndexWrapper.className = "ps-slide-index-wrapper";
      const slideIndexCopy = document.createElement("p");
      slideIndexCopy.textContent = slideIndex.toString().padStart(2, "0");
      const slideIndexSeparator = document.createElement("p");
      slideIndexSeparator.textContent = "/";
      const slidesTotalCount = document.createElement("p");
      slidesTotalCount.textContent = totalPsSlides.toString().padStart(2, "0");

      slideIndexWrapper.appendChild(slideIndexCopy);
      slideIndexWrapper.appendChild(slideIndexSeparator);
      slideIndexWrapper.appendChild(slidesTotalCount);

      slideInfo.appendChild(slideTags);
      slideInfo.appendChild(slideIndexWrapper);
      slide.appendChild(slideInfo);
    }

    return slide;
  }

  function splitPsText(slide) {
    const slideHeader = slide.querySelector(".ps-slide-title h1");
    if (slideHeader) {
      SplitText.create(slideHeader, {
        type: "words",
        wordsClass: "ps-word",
        mask: "words",
      });
    }

    const slideContent = slide.querySelectorAll("p, a");
    slideContent.forEach((element) => {
      SplitText.create(element, {
        type: "lines",
        linesClass: "ps-line",
        mask: "lines",
        reduceWhiteSpace: false,
      });
    });
  }

  function animatePsSlide(direction) {
    if (psIsAnimating || !psScrollAllowed) return;

    const nextSlideIndex =
      direction === "down"
        ? psCurrentSlide + 1
        : psCurrentSlide - 1;

    if (nextSlideIndex < 1 || nextSlideIndex > totalPsSlides) {
      return;
    }

    psIsAnimating = true;
    psScrollAllowed = false;

    const currentSlideElement = psSlider.querySelector(".ps-slide");

    psCurrentSlide = nextSlideIndex;

    const exitY = direction === "down" ? "-200vh" : "200vh";
    const entryY = direction === "down" ? "100vh" : "-100vh";
    const entryClipPath =
      direction === "down"
        ? "polygon(20% 20%, 80% 20%, 80% 100%, 20% 100%)"
        : "polygon(20% 0%, 80% 0%, 80% 80%, 20% 80%)";

    gsap.to(currentSlideElement, {
      scale: 0.25,
      opacity: 0,
      rotation: 30,
      y: exitY,
      duration: 2,
      ease: "power4.inOut",
      force3D: true,
      onComplete: () => {
        currentSlideElement.remove();
      },
    });

    setTimeout(() => {
      const newSlide = createPsSlide(psCurrentSlide);

      gsap.set(newSlide, {
        y: entryY,
        clipPath: entryClipPath,
        force3D: true,
      });

      psSlider.appendChild(newSlide);

      splitPsText(newSlide);

      const words = newSlide.querySelectorAll(".ps-word");
      const lines = newSlide.querySelectorAll(".ps-line");

      gsap.set([...words, ...lines], {
        y: "100%",
        force3D: true,
      });

      gsap.to(newSlide, {
        y: 0,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.5,
        ease: "power4.out",
        force3D: true,
        onStart: () => {
          const tl = gsap.timeline();

          const headerWords = newSlide.querySelectorAll(".ps-slide-title .ps-word");
          tl.to(
            headerWords,
            {
              y: "0%",
              duration: 1,
              ease: "power4.out",
              stagger: 0.1,
              force3D: true,
            },
            0.75
          );

          const tagsLines = newSlide.querySelectorAll(".ps-slide-tags .ps-line");
          const indexLines = newSlide.querySelectorAll(
            ".ps-slide-index-wrapper .ps-line"
          );
          const descriptionLines = newSlide.querySelectorAll(
            ".ps-slide-description .ps-line"
          );

          tl.to(
            tagsLines,
            {
              y: "0%",
              duration: 1,
              ease: "power4.out",
              stagger: 0.1,
            },
            "-=0.75"
          );

          tl.to(
            indexLines,
            {
              y: "0%",
              duration: 1,
              ease: "power4.out",
              stagger: 0.1,
            },
            "<"
          );

          tl.to(
            descriptionLines,
            {
              y: "0%",
              duration: 1,
              ease: "power4.out",
              stagger: 0.1,
            },
            "<"
          );

          const linkLines = newSlide.querySelectorAll(".ps-slide-link .ps-line");
          tl.to(
            linkLines,
            {
              y: "0%",
              duration: 1,
              ease: "power4.out",
            },
            "-=1"
          );
        },
        onComplete: () => {
          psIsAnimating = false;
          setTimeout(() => {
            psScrollAllowed = true;
            psLastScrollTime = Date.now();
          }, 100);
        },
      });
    }, 750);
  }

  function exitPsUp() {
    deactivatePs();
    lenis.scrollTo(Math.max(lenis.scroll - 400, 0), { duration: 1 });
  }

  function handlePsScroll(direction) {
    const now = Date.now();

    if (psIsAnimating || !psScrollAllowed) return;
    if (now - psLastScrollTime < 1000) return;

    if (direction === "up" && psCurrentSlide === 1) {
      deactivatePs();
      return;
    }

    if (direction === "down" && psCurrentSlide === totalPsSlides) {
      deactivatePs();
      return;
    }

    if (direction === "up" && psCurrentSlide > 1) {
      animatePsSlide("up");
      return;
    }

    psLastScrollTime = now;
    animatePsSlide(direction);
  }

  function psWheelHandler(e) {
    const rect = psWrapper.getBoundingClientRect();
    const insideSlider =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!insideSlider) return;

    const direction = e.deltaY > 0 ? "down" : "up";
    handlePsScroll(direction);
  }

  let psTouchStartY = 0;
  let psIsTouchActive = false;

  function psTouchStartHandler(e) {
    const rect = psWrapper.getBoundingClientRect();
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const insideSlider =
      touchX >= rect.left &&
      touchX <= rect.right &&
      touchY >= rect.top &&
      touchY <= rect.bottom;

    if (!insideSlider) {
      psIsTouchActive = false;
      return;
    }

    psTouchStartY = e.touches[0].clientY;
    psIsTouchActive = true;
  }

  function psTouchMoveHandler(e) {
    if (!psIsTouchActive || psIsAnimating || !psScrollAllowed) return;

    const touchCurrentY = e.touches[0].clientY;
    const difference = psTouchStartY - touchCurrentY;

    if (Math.abs(difference) > 50) {
      psIsTouchActive = false;
      const direction = difference > 0 ? "down" : "up";
      handlePsScroll(direction);
    }
  }

  function psTouchEndHandler() {
    psIsTouchActive = false;
  }

  function activatePs() {
    if (psActive) return;
    psActive = true;
    window.addEventListener("wheel", psWheelHandler, { passive: true });
    window.addEventListener("touchstart", psTouchStartHandler, { passive: true });
    window.addEventListener("touchmove", psTouchMoveHandler, { passive: true });
    window.addEventListener("touchend", psTouchEndHandler);
  }

  function deactivatePs() {
    if (!psActive) return;
    psActive = false;
    window.removeEventListener("wheel", psWheelHandler);
    window.removeEventListener("touchstart", psTouchStartHandler);
    window.removeEventListener("touchmove", psTouchMoveHandler);
    window.removeEventListener("touchend", psTouchEndHandler);
  }

  function checkPsActivation() {
    const rect = psWrapper.getBoundingClientRect();
    const shouldActivate = rect.top <= window.innerHeight * 0.2 && rect.bottom >= 0;

    if (shouldActivate && !psActive) {
      activatePs();
    } else if (!shouldActivate && psActive) {
      deactivatePs();
    }
  }

  const psObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          checkPsActivation();
        } else if (psActive) {
          deactivatePs();
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  psObserver.observe(psWrapper);
  checkPsActivation();
  window.addEventListener("resize", checkPsActivation);
  lenis.on("scroll", checkPsActivation);
});
