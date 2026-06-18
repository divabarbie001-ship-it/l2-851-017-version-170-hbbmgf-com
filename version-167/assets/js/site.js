(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function initMobileMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initHeroCarousel() {
        var root = document.querySelector("[data-hero-carousel]");
        if (!root) {
            return;
        }
        var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
        var prev = root.querySelector("[data-hero-prev]");
        var next = root.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
                dot.setAttribute("aria-current", dotIndex === current ? "true" : "false");
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                restart();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
                restart();
            });
        });

        show(0);
        restart();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initFilters() {
        var roots = Array.prototype.slice.call(document.querySelectorAll("[data-filter-root]"));
        roots.forEach(function (root) {
            var input = root.querySelector("[data-filter-search]");
            var year = root.querySelector("[data-filter-year]");
            var region = root.querySelector("[data-filter-region]");
            var type = root.querySelector("[data-filter-type]");
            var category = root.querySelector("[data-filter-category]");
            var sort = root.querySelector("[data-filter-sort]");
            var grid = root.querySelector("[data-filter-grid]");
            var count = root.querySelector("[data-filter-count]");
            var empty = root.querySelector("[data-empty-state]");
            if (!grid) {
                return;
            }
            var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));

            function selected(control) {
                return control ? normalize(control.value) : "";
            }

            function sortCards(visibleCards) {
                var mode = selected(sort);
                if (!mode) {
                    return visibleCards;
                }
                return visibleCards.sort(function (a, b) {
                    if (mode === "views") {
                        return Number(b.dataset.views || 0) - Number(a.dataset.views || 0);
                    }
                    if (mode === "rating") {
                        return Number(b.dataset.rating || 0) - Number(a.dataset.rating || 0);
                    }
                    if (mode === "year") {
                        return Number(b.dataset.year || 0) - Number(a.dataset.year || 0);
                    }
                    return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "zh-Hans-CN");
                });
            }

            function apply() {
                var query = normalize(input && input.value);
                var selectedYear = selected(year);
                var selectedRegion = selected(region);
                var selectedType = selected(type);
                var selectedCategory = selected(category);
                var visibleCards = [];

                cards.forEach(function (card) {
                    var matches = true;
                    if (query && normalize(card.dataset.search).indexOf(query) === -1) {
                        matches = false;
                    }
                    if (selectedYear && normalize(card.dataset.year) !== selectedYear) {
                        matches = false;
                    }
                    if (selectedRegion && normalize(card.dataset.region) !== selectedRegion) {
                        matches = false;
                    }
                    if (selectedType && normalize(card.dataset.type) !== selectedType) {
                        matches = false;
                    }
                    if (selectedCategory && normalize(card.dataset.category) !== selectedCategory) {
                        matches = false;
                    }
                    card.classList.toggle("is-hidden-by-filter", !matches);
                    if (matches) {
                        visibleCards.push(card);
                    }
                });

                sortCards(visibleCards).forEach(function (card) {
                    grid.appendChild(card);
                });

                if (count) {
                    count.textContent = "当前显示 " + visibleCards.length + " 部影片";
                }
                if (empty) {
                    empty.classList.toggle("is-visible", visibleCards.length === 0);
                }
            }

            [input, year, region, type, category, sort].forEach(function (control) {
                if (control) {
                    control.addEventListener(control.tagName === "INPUT" ? "input" : "change", apply);
                }
            });
            apply();
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
        players.forEach(function (player) {
            var video = player.querySelector("video[data-hls-player]");
            var overlay = player.querySelector("[data-play-overlay]");
            var status = player.querySelector("[data-player-status]");
            if (!video) {
                return;
            }
            var source = video.dataset.src;
            var hlsInstance = null;

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function attachSource() {
                if (!source) {
                    setStatus("当前页面没有可用播放源。");
                    return;
                }
                if (video.dataset.attached === "true") {
                    return;
                }
                video.dataset.attached = "true";
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    setStatus("HLS 播放源已就绪，可点击播放。");
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus("HLS 播放源已解析，可点击播放。");
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (data && data.fatal) {
                            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                                setStatus("网络加载异常，正在尝试恢复播放源。");
                                hlsInstance.startLoad();
                            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                                setStatus("媒体解码异常，正在尝试恢复。");
                                hlsInstance.recoverMediaError();
                            } else {
                                setStatus("播放器遇到错误，请刷新页面重试。");
                                hlsInstance.destroy();
                            }
                        }
                    });
                } else {
                    setStatus("当前浏览器不支持 HLS 播放，请使用 Chrome、Safari、Firefox 或 Edge 的新版浏览器。");
                }
            }

            attachSource();

            if (overlay) {
                overlay.addEventListener("click", function () {
                    attachSource();
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === "function") {
                        playPromise.catch(function () {
                            setStatus("浏览器阻止了自动播放，请使用播放器控制栏再次点击播放。");
                        });
                    }
                });
            }

            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
            });
            video.addEventListener("pause", function () {
                if (overlay && video.currentTime === 0) {
                    overlay.classList.remove("is-hidden");
                }
            });
            video.addEventListener("ended", function () {
                if (overlay) {
                    overlay.classList.remove("is-hidden");
                }
            });

            window.addEventListener("beforeunload", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        initMobileMenu();
        initHeroCarousel();
        initFilters();
        initPlayers();
    });
})();
