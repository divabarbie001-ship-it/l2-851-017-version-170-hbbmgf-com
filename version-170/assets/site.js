const SiteUI = (() => {
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  };

  const initMenu = () => {
    const toggle = document.querySelector("[data-menu-toggle]");
    const nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  };

  const initHero = () => {
    const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    let index = 0;
    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, itemIndex) => {
        slide.classList.toggle("active", itemIndex === index);
      });
      dots.forEach((dot, itemIndex) => {
        dot.classList.toggle("active", itemIndex === index);
      });
    };
    dots.forEach((dot, itemIndex) => {
      dot.addEventListener("click", () => show(itemIndex));
    });
    window.setInterval(() => show(index + 1), 5200);
  };

  const initFilters = () => {
    const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach((panel) => {
      const scope = panel.parentElement || document;
      const cards = Array.from(scope.querySelectorAll("[data-card-list] article"));
      if (!cards.length) {
        return;
      }
      const input = panel.querySelector("[data-filter-input]");
      const year = panel.querySelector("[data-year-filter]");
      const region = panel.querySelector("[data-region-filter]");
      const type = panel.querySelector("[data-type-filter]");
      const apply = () => {
        const keyword = (input ? input.value : "").trim().toLowerCase();
        const yearValue = year ? year.value : "";
        const regionValue = region ? region.value : "";
        const typeValue = type ? type.value : "";
        cards.forEach((card) => {
          const text = [
            card.dataset.title || "",
            card.dataset.region || "",
            card.dataset.genre || "",
            card.dataset.year || "",
            card.textContent || ""
          ].join(" ").toLowerCase();
          const matchesKeyword = !keyword || text.includes(keyword);
          const matchesYear = !yearValue || (card.dataset.year || "") === yearValue;
          const matchesRegion = !regionValue || (card.dataset.region || "") === regionValue;
          const matchesType = !typeValue || text.includes(typeValue.toLowerCase());
          card.classList.toggle("is-hidden-card", !(matchesKeyword && matchesYear && matchesRegion && matchesType));
        });
      };
      [input, year, region, type].forEach((element) => {
        if (element) {
          element.addEventListener("input", apply);
          element.addEventListener("change", apply);
        }
      });
      const params = new URLSearchParams(window.location.search);
      if (input && params.get("q")) {
        input.value = params.get("q");
        apply();
      }
    });
  };

  ready(() => {
    initMenu();
    initHero();
    initFilters();
  });

  return {
    ready
  };
})();

const MoviePlayer = (() => {
  const mount = ({ videoId, buttonId, url }) => {
    const video = document.getElementById(videoId);
    const button = document.getElementById(buttonId);
    if (!video || !button || !url) {
      return;
    }
    let attached = false;
    let hls = null;
    const attach = () => {
      if (attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        return;
      }
      video.src = url;
    };
    const play = () => {
      attach();
      button.classList.add("is-hidden");
      video.controls = true;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(() => {
          button.classList.remove("is-hidden");
        });
      }
    };
    button.addEventListener("click", play);
    video.addEventListener("click", () => {
      if (video.paused) {
        play();
      }
    });
    window.addEventListener("pagehide", () => {
      if (hls) {
        hls.destroy();
      }
    });
  };

  return {
    mount
  };
})();
