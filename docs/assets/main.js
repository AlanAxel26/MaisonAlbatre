/* =====================================================================
   main.js : JavaScript vanille, sans dépendance
   1. Apparition au défilement
   2. En-tête et menu burger
   3. Statut ouvert / fermé et horaires du jour
   4. Carte : onglets et filtres de régime
   5. Plan à la demande
   6. Formulaire de réservation (validation, e-mail, Formspree, WhatsApp)
   7. Barre de réservation mobile
   8. Vidéo d'accueil (lecture à l'arrivée, bouton pause)
   9. Appel téléphonique (repli : numéro affiché et copiable)
   10. Mentions légales ouvertes par lien direct
   ===================================================================== */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /* 1. APPARITION AU DÉFILEMENT ------------------------------------- */
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* 2. EN-TÊTE ET MENU BURGER --------------------------------------- */
  const header = $(".site-header");
  const burger = $(".burger");
  const nav = $("#site-nav");

  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (burger && nav) {
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    };
    const isOpen = () => burger.getAttribute("aria-expanded") === "true";

    burger.addEventListener("click", () => setOpen(!isOpen()));
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        burger.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });
    window.matchMedia("(min-width: 56em)").addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* 3. STATUT OUVERT / FERMÉ ---------------------------------------- */
  const hoursNode = $("#hours-data");
  if (hoursNode) {
    let data;
    try {
      data = JSON.parse(hoursNode.textContent);
    } catch {
      data = null;
    }

    if (data) {
      const WEEKDAYS = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
      const toMinutes = (t) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };
      const fmt = (t) => {
        const [h, m] = t.split(":");
        return `${Number(h)}h${m}`;
      };

      // Heure actuelle dans le fuseau du commerce, quel que soit le visiteur
      const nowInShopZone = () => {
        try {
          const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: data.timezone,
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23",
          }).formatToParts(new Date());
          const get = (type) => parts.find((p) => p.type === type).value;
          return {
            day: WEEKDAYS[get("weekday")],
            minutes: Number(get("hour")) * 60 + Number(get("minute")),
          };
        } catch {
          const d = new Date();
          return { day: (d.getDay() + 6) % 7, minutes: d.getHours() * 60 + d.getMinutes() };
        }
      };

      const computeStatus = () => {
        const { day, minutes } = nowInShopZone();
        for (const [from, to] of data.days[day].ranges) {
          if (minutes >= toMinutes(from) && minutes < toMinutes(to)) {
            return { day, open: true, until: to };
          }
        }
        for (let offset = 0; offset < 8; offset += 1) {
          const d = (day + offset) % 7;
          for (const [from] of data.days[d].ranges) {
            if (offset === 0 && toMinutes(from) <= minutes) continue;
            return { day, open: false, offset, nextDay: d, at: from };
          }
        }
        return { day, open: false, offset: null };
      };

      const render = () => {
        const status = computeStatus();
        let text;
        if (status.open) {
          text = `Ouvert, jusqu'à ${fmt(status.until)}`;
        } else if (status.offset === null) {
          text = "Fermé";
        } else if (status.offset === 0) {
          text = `Fermé, ouvre à ${fmt(status.at)}`;
        } else if (status.offset === 1) {
          text = `Fermé, ouvre demain à ${fmt(status.at)}`;
        } else {
          text = `Fermé, ouvre ${data.days[status.nextDay].label.toLowerCase()} à ${fmt(status.at)}`;
        }

        $$("[data-status]").forEach((node) => {
          node.dataset.state = status.open ? "open" : "closed";
          const label = $("[data-status-text]", node);
          if (label) label.textContent = text;
        });

        const ranges = data.days[status.day].ranges;
        const todayText = ranges.length
          ? `Aujourd'hui, ${ranges.map(([a, z]) => `${fmt(a)} – ${fmt(z)}`).join(" et ")}`
          : "Fermé aujourd'hui";
        $$("[data-today-hours]").forEach((node) => {
          node.textContent = todayText;
        });

        $$(".hours tr").forEach((row) => {
          const isToday = Number(row.dataset.day) === status.day;
          row.classList.toggle("is-today", isToday);
          if (isToday) row.setAttribute("aria-current", "date");
          else row.removeAttribute("aria-current");
        });
      };

      render();
      setInterval(render, 60000);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) render();
      });
    }
  }

  /* 4. CARTE : ONGLETS ET FILTRES DE RÉGIME -------------------------- */
  const menu = $("[data-menu]");
  if (menu) {
    const tabs = $$('[role="tab"]', menu);
    const panels = $$('[role="tabpanel"]', menu);
    const chips = $$("[data-filter]", menu);
    const menuStatus = $("[data-menu-status]", menu);

    const select = (index, focus = false) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        let next = null;
        if (event.key === "ArrowRight") next = i === last ? 0 : i + 1;
        else if (event.key === "ArrowLeft") next = i === 0 ? last : i - 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = last;
        if (next !== null) {
          event.preventDefault();
          select(next, true);
        }
      });
    });
    select(0);

    const applyFilters = () => {
      const active = chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.filter);
      let shown = 0;
      panels.forEach((panel) => {
        const dishes = $$(".dish", panel);
        let visible = 0;
        dishes.forEach((dish) => {
          const diets = (dish.dataset.diets || "").split(" ");
          const ok = active.every((f) => diets.includes(f));
          dish.hidden = !ok;
          if (ok) visible += 1;
        });
        $(".menu__empty", panel).hidden = visible !== 0;
        shown += visible;
      });
      menuStatus.textContent = active.length
        ? `${shown} plat${shown > 1 ? "s" : ""} correspondent à votre filtre.`
        : "Filtre retiré : tous les plats sont affichés.";
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
        applyFilters();
      });
    });
  }

  /* 5. CARTE --------------------------------------------------------
     Le cadre est ajouté au-dessus du message d'attente : tant que la carte n'est pas
     chargée, le visiteur garde les liens « Ouvrir dans... » sous les yeux. Avec
     data-autoload="true", la carte se charge quand la section approche de l'écran. */
  const map = $("[data-map]");
  const mapButton = $("[data-map-load]");
  if (map && mapButton) {
    const placeholder = $(".map__placeholder", map);
    let mapLoaded = false;
    const loadMap = (focus) => {
      if (mapLoaded) return;
      mapLoaded = true;
      mapButton.hidden = true;
      const text = $("[data-map-text]", map);
      if (text) text.textContent = "Chargement de la carte…";
      const frame = document.createElement("iframe");
      frame.title = map.dataset.title || "Carte";
      frame.loading = "eager";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.allowFullscreen = true;
      frame.addEventListener("load", () => placeholder && placeholder.remove());
      frame.src = map.dataset.src;
      map.appendChild(frame);
      if (focus) frame.focus();
    };
    mapButton.addEventListener("click", () => loadMap(true));

    const saveData = navigator.connection && navigator.connection.saveData;
    if (map.dataset.autoload === "true" && !saveData) {
      if ("IntersectionObserver" in window) {
        const mapObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              mapObserver.disconnect();
              loadMap(false);
            }
          },
          { rootMargin: "400px 0px" }
        );
        mapObserver.observe(map);
      } else {
        loadMap(false);
      }
    }
  }

  /* 6. FORMULAIRE DE RÉSERVATION ------------------------------------- */
  const form = $("#contact-form");
  if (form) {
    const statusNode = $("[data-form-status]", form);
    const submitButton = $("[data-submit]", form);
    const altButton = $("[data-alt-send]", form);
    const { endpoint, mailto, phone, whatsapp, via, name: shopName, timezone } = form.dataset;

    // Jours de fermeture, lus dans le tableau d'horaires (0 = lundi)
    let closedDays = [];
    try {
      const hours = JSON.parse($("#hours-data").textContent);
      closedDays = hours.days.map((d, i) => (d.ranges.length ? null : i)).filter((i) => i !== null);
    } catch {
      closedDays = [];
    }

    // Date du jour dans le fuseau du restaurant, au format AAAA-MM-JJ
    const today = (() => {
      try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    })();
    const dateField = form.elements.date;
    dateField.min = today;

    const weekdayOf = (iso) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;
    const dateLabel = (iso) =>
      new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
        new Date(`${iso}T12:00:00Z`)
      );

    const rules = {
      date: (value) => {
        if (!value) return "Choisissez une date.";
        if (value < today) return "Cette date est passée : choisissez une date à venir.";
        if (closedDays.includes(weekdayOf(value))) return "Le restaurant est fermé ce jour-là : choisissez un autre jour.";
        return true;
      },
      time: (value) => value !== "" || "Choisissez une heure.",
      name: (value) => value.trim().length >= 2 || "Indiquez votre nom (2 caractères minimum).",
      phone: (value) =>
        /^\+?[0-9 .()-]{8,20}$/.test(value.trim()) ||
        "Indiquez un numéro valide pour confirmer la réservation (8 à 20 chiffres, espaces ou +).",
      email: (value) =>
        value.trim() === "" ||
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ||
        "Cette adresse e-mail semble incorrecte, par exemple nom@domaine.com.",
      consent: (_value, field) => field.checked || "Cochez la case pour que nous puissions traiter votre demande.",
    };

    const validateField = (fieldName) => {
      const field = form.elements[fieldName];
      const error = $(`#f-${fieldName}-err`, form);
      if (!field || !error) return true;
      const result = rules[fieldName](field.value, field);
      const valid = result === true;
      field.setAttribute("aria-invalid", String(!valid));
      error.hidden = valid;
      error.textContent = valid ? "" : result;
      return valid;
    };

    const setStatus = (message, type) => {
      statusNode.textContent = message;
      if (type) statusNode.dataset.type = type;
      else delete statusNode.dataset.type;
    };

    // Validation à la sortie du champ, puis en direct une fois l'erreur affichée
    Object.keys(rules).forEach((fieldName) => {
      const field = form.elements[fieldName];
      if (!field) return;
      field.addEventListener("blur", () => {
        if (field.value !== "" || field.type === "checkbox") validateField(fieldName);
      });
      const live = field.type === "checkbox" || field.tagName === "SELECT" || field.type === "date" ? "change" : "input";
      field.addEventListener(live, () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(fieldName);
      });
    });

    // Valide tout le formulaire ; renvoie true s'il est correct
    const validateAll = () => {
      const results = Object.keys(rules).map((n) => ({ n, ok: validateField(n) }));
      const bad = results.find((r) => !r.ok);
      if (bad) {
        form.elements[bad.n].focus();
        setStatus("Certains champs sont à corriger avant l'envoi.", "error");
        return false;
      }
      return true;
    };

    // Composition de la demande : adultes, enfants, date, heure, coordonnées
    const people = () => {
      const adults = Number(form.elements.guests.value);
      const kids = Number(form.elements.children ? form.elements.children.value : 0);
      let text = `${adults} adulte${adults > 1 ? "s" : ""}`;
      if (kids > 0) text += ` et ${kids} enfant${kids > 1 ? "s" : ""}`;
      return text;
    };

    const fields = () => {
      const data = new FormData(form);
      const rows = [
        ["Date", dateLabel(data.get("date"))],
        ["Heure", String(data.get("time")).replace(":", "h")],
        ["Personnes", people()],
        ["Nom", String(data.get("name")).trim()],
        ["Téléphone", String(data.get("phone")).trim()],
      ];
      if (String(data.get("email")).trim()) rows.push(["E-mail", String(data.get("email")).trim()]);
      if (String(data.get("message")).trim()) rows.push(["Précisions", String(data.get("message")).trim()]);
      return rows;
    };

    // Message WhatsApp (le texte entre * apparaît en gras dans WhatsApp)
    const whatsappText = () =>
      [
        `Bonjour ${shopName},`,
        "Je souhaite réserver une table :",
        ...fields().map(([k, v]) => `*${k} :* ${v}`),
        "Merci de me confirmer la disponibilité.",
      ].join("\n");

    const emailLines = () => [
      `Demande de réservation : ${people()}, ${dateLabel(form.elements.date.value)} à ${form.elements.time.value.replace(":", "h")}.`,
      ...fields().slice(3).map(([k, v]) => `${k} : ${v}`),
    ];

    // Un clic sur « Réserver le menu dégustation » pré-remplit la demande
    $$("[data-tasting]").forEach((link) => {
      link.addEventListener("click", () => {
        const message = form.elements.message;
        if (message && !message.value.trim()) message.value = "Menu dégustation, pour toute la table.";
      });
    });

    const setStatusLink = (message, href, linkLabel) => {
      statusNode.textContent = message + " ";
      statusNode.dataset.type = "success";
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = linkLabel;
      statusNode.append(link);
    };

    const sendWhatsapp = () => {
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappText())}`;
      const opened = window.open(url, "_blank", "noopener");
      if (!opened) window.location.href = url;
      setStatusLink("WhatsApp s'ouvre avec votre message prêt : appuyez sur Envoyer. S'il ne s'ouvre pas,", url, "ouvrez-le ici.");
    };

    const sendEmail = async () => {
      if (endpoint) {
        submitButton.disabled = true;
        setStatus("Envoi en cours...", null);
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw new Error(String(response.status));
          form.reset();
          setStatus("Merci, votre demande est bien partie. Nous vous confirmons la table par téléphone ou par message.", "success");
        } catch {
          setStatus(`L'envoi a échoué. Réessayez dans un instant ou appelez-nous au ${phone}.`, "error");
        } finally {
          submitButton.disabled = false;
        }
        return;
      }
      // Sans service d'envoi : ouverture de la messagerie avec la demande prête
      window.location.href =
        `mailto:${mailto}?subject=${encodeURIComponent(`Réservation : ${form.elements.name.value}`)}` +
        `&body=${encodeURIComponent(emailLines().join("\n"))}`;
      setStatus("Votre messagerie va s'ouvrir avec la demande prête à envoyer. Il vous reste à l'envoyer.", "success");
    };

    const send = (mode) => {
      setStatus("", null);
      if (!validateAll()) return;
      // Champ piège : un humain ne le remplit jamais
      if (form.elements._gotcha && form.elements._gotcha.value) {
        setStatus("Merci, votre demande est bien partie.", "success");
        form.reset();
        return;
      }
      if (mode === "whatsapp" && whatsapp) sendWhatsapp();
      else sendEmail();
    };

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      send(via === "whatsapp" ? "whatsapp" : "email");
    });

    if (altButton) {
      altButton.addEventListener("click", () => send(altButton.dataset.altSend));
    }
  }

  /* 7. BARRE DE RÉSERVATION MOBILE ----------------------------------- */
  const reserveBar = $("[data-reserve-bar]");
  if (reserveBar && "IntersectionObserver" in window) {
    const covered = new Set();
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) covered.add(entry.target);
        else covered.delete(entry.target);
      }
      reserveBar.classList.toggle("is-hidden", covered.size > 0);
    });
    // Masquée tant que l'accueil (et son bouton) ou le formulaire sont à l'écran
    ["#reserver", ".hero__actions"].forEach((selector) => {
      const node = $(selector);
      if (node) watch.observe(node);
    });
  }

  /* 8. VIDÉO D'ACCUEIL ----------------------------------------------
     Démarre à l'arrivée sur le site, sans son. Trois filets de sécurité :
     1. lecture automatique native ;
     2. si le navigateur la bloque (économie d'énergie, fenêtre intégrée), on
        retente au premier geste et à chaque retour de l'accueil à l'écran ;
     3. si la lecture reste bloquée, on fait avancer la vidéo image par image
        (sans appeler play), ce qui ne demande aucune autorisation.
     Un bouton Pause / Lecture / Rejouer reste toujours disponible.
     L'économiseur de données empêche le démarrage automatique. */
  const video = $("[data-hero-video]");
  if (video) {
    const saveData = navigator.connection && navigator.connection.saveData;
    const respectReduce = video.dataset.respectReduce === "true";
    const reduce = respectReduce && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stoppedByUser = false; // mise en pause volontaire : on n'insiste pas
    let manual = false; // lecture image par image en cours
    let manualEnded = false;
    let manualStart = 0;
    let manualFrom = 0;
    let raf = 0;
    let nativeFailed = false;

    const playing = () => manual || !video.paused;
    const ended = () => video.ended || manualEnded;

    const label = () => {};

    const stopManual = () => {
      manual = false;
      cancelAnimationFrame(raf);
    };

    const stepManual = (now) => {
      if (!manual) return;
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        raf = requestAnimationFrame(stepManual);
        return;
      }
      const t = Math.min(duration, manualFrom + (now - manualStart) / 1000);
      if (!video.seeking) video.currentTime = t;
      if (t >= duration - 0.05) {
        manual = false;
        manualEnded = true;
        label();
        return;
      }
      raf = requestAnimationFrame(stepManual);
    };

    const startManual = () => {
      if (manual || stoppedByUser || reduce || saveData) return;
      manual = true;
      manualEnded = false;
      manualFrom = video.currentTime || 0;
      manualStart = performance.now();
      raf = requestAnimationFrame(stepManual);
      label();
    };

    const tryPlay = () => {
      if (reduce || saveData || stoppedByUser || ended()) return;
      if (!video.paused) {
        stopManual();
        return;
      }
      const promise = video.play();
      if (promise && typeof promise.then === "function") {
        promise.then(
          () => {
            stopManual();
            label();
          },
          () => {
            nativeFailed = true;
            startManual();
          }
        );
      }
    };

    video.addEventListener("playing", () => {
      stopManual();
      label();
    });
    video.addEventListener("pause", label);
    video.addEventListener("ended", () => {
      manualEnded = false;
      label();
    });
    video.addEventListener("canplay", tryPlay);
    const hide = () => {
      stopManual();
    };
    video.addEventListener("error", hide);
    $$("source", video).forEach((source) => source.addEventListener("error", hide));

    // 1) au chargement
    tryPlay();
    label();

    // 2) au premier geste ou au retour de l'accueil à l'écran
    const gestures = ["scroll", "wheel", "touchstart", "touchmove", "pointerdown", "pointermove", "keydown"];
    let lastTry = 0;
    const onGesture = () => {
      const now = performance.now();
      if ((nativeFailed || video.paused) && now - lastTry > 500) {
        lastTry = now;
        tryPlay();
      }
      if (!video.paused) gestures.forEach((g) => window.removeEventListener(g, onGesture));
    };
    gestures.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) tryPlay();
        },
        { threshold: 0.35 }
      ).observe(video);
    }
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });
  }

  /* 8b. PHOTOS DE L'ARCHE ------------------------------------------
     Fondu enchaîné entre les photos. Sans JavaScript, la première reste affichée.
     Pause quand l'onglet est caché, quand l'accueil est hors écran ou si l'appareil demande
     de réduire les animations. */
  const slides = $("[data-slides]");
  if (slides) {
    const items = $$(".slide", slides);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seconds = Math.max(2, Number(slides.dataset.seconds) || 5);
    slides.style.setProperty("--slide-time", seconds + 1.5 + "s");
    if (items.length > 1 && !reduce) {
      let current = 0;
      let timer = null;
      let onScreen = true;
      const show = (n) => {
        items[current].classList.remove("is-active");
        items[current].setAttribute("aria-hidden", "true");
        current = n % items.length;
        items[current].classList.add("is-active");
        items[current].removeAttribute("aria-hidden");
      };
      const stop = () => {
        clearInterval(timer);
        timer = null;
      };
      const start = () => {
        if (!timer && onScreen && !document.hidden) timer = setInterval(() => show(current + 1), seconds * 1000);
      };
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
          onScreen = entries.some((e) => e.isIntersecting);
          onScreen ? start() : stop();
        }).observe(slides);
      }
      start();
    }
  }

  /* 9. APPEL TÉLÉPHONIQUE ---------------------------------------------
     Un appui sur un lien « tel: » ouvre l'application Téléphone avec le numéro
     prêt à composer. Si rien ne s'ouvre (ordinateur, aperçu intégré, appareil
     sans téléphonie), un petit message affiche le numéro avec un bouton Copier. */
  const callToast = $("[data-call-toast]");
  if (callToast) {
    const copyButton = $("[data-call-copy]", callToast);
    const numberNode = $("[data-call-number]", callToast);
    let hideTimer = 0;
    let leaveTimer = 0;
    let left = false;

    const showToast = () => {
      callToast.hidden = false;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        callToast.hidden = true;
      }, 9000);
    };
    const markLeft = () => {
      left = true;
    };
    ["blur", "pagehide"].forEach((e) => window.addEventListener(e, markLeft));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) markLeft();
    });

    $$('a[href^="tel:"]').forEach((link) => {
      link.addEventListener("click", () => {
        left = false;
        clearTimeout(leaveTimer);
        // Si la page est encore là après 1,2 s, l'application Téléphone ne s'est pas ouverte
        leaveTimer = setTimeout(() => {
          if (!left) showToast();
        }, 1200);
      });
    });

    copyButton.addEventListener("click", async () => {
      const text = numberNode.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = "Copié";
      } catch {
        const range = document.createRange();
        range.selectNodeContents(numberNode);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        copyButton.textContent = "Sélectionné";
      }
      setTimeout(() => {
        copyButton.textContent = "Copier";
      }, 2000);
    });
  }

  /* 10. MENTIONS LÉGALES --------------------------------------------- */
  const legal = $("#mentions");
  const openLegalFromHash = () => {
    if (legal && window.location.hash === "#mentions") legal.open = true;
  };
  openLegalFromHash();
  window.addEventListener("hashchange", openLegalFromHash);
})();
