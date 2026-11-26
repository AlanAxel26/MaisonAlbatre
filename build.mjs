// =====================================================================
//  build.mjs : génère le site statique dans le dossier /docs
//
//  Usage :  node build.mjs
//  Aucune dépendance à installer (Node 18 ou plus récent).
//
//  Entrées : site.config.mjs (contenu) + src/ (styles, script, images)
//  Sorties : docs/index.html, docs/404.html, docs/assets/*, robots.txt,
//            sitemap.xml, .nojekyll
// =====================================================================

import { readFile, writeFile, mkdir, cp, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
// SITE_CONFIG et SITE_OUT servent aux essais (autre configuration, autre dossier de sortie).
const configUrl = process.env.SITE_CONFIG
  ? pathToFileURL(path.resolve(process.env.SITE_CONFIG)).href
  : pathToFileURL(path.join(root, "site.config.mjs")).href;
const config = (await import(configUrl)).default;
const src = path.join(root, "src");
const out = process.env.SITE_OUT
  ? path.resolve(process.env.SITE_OUT)
  : path.join(root, "docs");
const c = config;
const b = c.business;
// Lien d'appel : calculé depuis le numéro affiché (chiffres et "+" uniquement), sauf si phoneLink est renseigné
b.phoneLink = (b.phoneLink || b.phone).replace(/[^\d+]/g, "");

// ---------- Palette (config.theme) ------------------------------------
const DEFAULT_THEME = {
  primary: "#0F3D3A",
  secondary: "#DCE8E3",
  accent: "#F2A93B",
  background: "#F6F7F4",
  text: "#16221F",
  textSoft: "#44605A",
  header: "light",
};
const T = { ...DEFAULT_THEME, ...(c.theme || {}) };

const toRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb) =>
  "#" +
  rgb
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("");
// t = 0 donne la couleur a, t = 1 donne la couleur b
const mix = (a, b2, t) => {
  const A = toRgb(a);
  const B = toRgb(b2);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const relLum = (hex) => {
  const [r, g, bl] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
};
const contrast = (x, y) => {
  const [hi, lo] = [relLum(x), relLum(y)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};
const bestOn = (bg, list) =>
  list.reduce((best, col) => (contrast(col, bg) > contrast(best, bg) ? col : best));
const firstMix = (from, to, start, end, step, ok) => {
  for (let k = start; k <= end + 1e-9; k += step) {
    const col = mix(from, to, k);
    if (ok(col)) return col;
  }
  return mix(from, to, end);
};

// Fond de section : calculé à partir du fond de page si non fourni
if (!T.secondary) T.secondary = mix(T.background, T.text, 0.07);
// Texte secondaire : assombri au minimum nécessaire si le contraste est insuffisant
const inkSoftOriginal = T.textSoft;
let inkSoft = inkSoftOriginal;
if (contrast(inkSoft, T.background) < 4.6 || contrast(inkSoft, T.secondary) < 4.6) {
  inkSoft = firstMix(
    inkSoftOriginal,
    T.text,
    0.03,
    1,
    0.03,
    (col) => contrast(col, T.background) >= 4.6 && contrast(col, T.secondary) >= 4.6
  );
}
const primaryInk =
  contrast(T.background, T.primary) >= 7
    ? T.background
    : bestOn(T.primary, ["#ffffff", T.background, T.text]);
const primarySoft = firstMix(T.primary, "#ffffff", 0.78, 0.97, 0.02, (col) => contrast(col, T.primary) >= 7);
const primaryHover = mix(T.primary, "#ffffff", 0.08);
const accentHover = mix(T.accent, "#ffffff", 0.25);
// Remplissage au survol des boutons d'action : le doré s'approfondit (couleur du bouton, plus sombre)
const accentDeep = mix(T.accent, "#000000", 0.45);
const onAccentDeep = bestOn(accentDeep, ["#ffffff", T.background]);
const onAccent =
  contrast(T.text, T.accent) >= 7 ? T.text : bestOn(T.accent, [T.text, "#ffffff", "#000000"]);
const lineColor = mix(T.background, T.primary, 0.22);
const fieldBorder = firstMix("#ffffff", T.text, 0.45, 1, 0.05, (col) => contrast(col, "#ffffff") >= 3.1);
const footerText = firstMix(T.text, "#ffffff", 0.85, 1, 0.03, (col) => contrast(col, T.text) >= 7);
const footerSoft = firstMix(T.text, "#ffffff", 0.7, 1, 0.03, (col) => contrast(col, T.text) >= 5);
const rgbTriplet = (hex) => toRgb(hex).join(" ");

const themeCss = `:root{--bg:${T.background};--tint:${T.secondary};--ink:${T.text};--ink-soft:${inkSoft};--primary:${T.primary};--primary-ink:${primaryInk};--primary-soft:${primarySoft};--primary-hover:${primaryHover};--accent:${T.accent};--accent-hover:${accentHover};--on-accent:${onAccent};--accent-deep:${accentDeep};--on-accent-deep:${onAccentDeep};--line:${lineColor};--field-border:${fieldBorder};--footer-text:${footerText};--footer-soft:${footerSoft};--primary-rgb:${rgbTriplet(T.primary)};--accent-rgb:${rgbTriplet(T.accent)};--primary-ink-rgb:${rgbTriplet(primaryInk)}}`;

const contrastChecks = [
  ["texte sur le fond", T.text, T.background, 4.5],
  ["texte secondaire sur le fond", inkSoft, T.background, 4.5],
  ["texte secondaire sur la couleur secondaire", inkSoft, T.secondary, 4.5],
  ["titres (primary) sur le fond", T.primary, T.background, 4.5],
  ["titres (primary) sur la couleur secondaire", T.primary, T.secondary, 4.5],
  ["texte des boutons d'action", onAccent, T.accent, 4.5],
  ["texte des boutons d'action survolés", onAccentDeep, accentDeep, 4.5],
  ["texte clair sur la couleur primary", primaryInk, T.primary, 4.5],
  ["texte clair sur primary survolée", primaryInk, primaryHover, 4.5],
  ["texte atténué sur la couleur primary", primarySoft, T.primary, 4.5],
  ["liens d'accent sur la couleur primary", T.accent, T.primary, 4.5],
  ["texte du pied de page", footerText, T.text, 4.5],
];

// Mots du titre d'accueil, révélés un par un
const splitWords = (text) =>
  text
    .split(" ")
    .map((w, i) => `<span class="word"><span class="word__in" style="--w:${i}">${esc(w)}</span></span>`)
    .join(" ");

// ---------- Outils ----------------------------------------------------
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const fmtTime = (t) => {
  const [h, m] = t.split(":");
  return `${Number(h)}h${m}`;
};

const hash = (text) => createHash("md5").update(text).digest("hex").slice(0, 8);

const addressLines = [
  b.address.street,
  b.address.line2,
  [b.address.postalCode, b.address.city].filter(Boolean).join(" "),
  b.address.countryName,
].filter(Boolean);

const addressInline = addressLines.join(", ");
const { lat, lon } = b.geo;
const mapCfg = { provider: "google", locate: "address", zoom: 16, autoLoad: true, ...(b.map || {}) };
const zoom = Math.min(19, Math.max(1, Number(mapCfg.zoom) || 16));
const useOsm = mapCfg.provider === "osm";
// Google Maps retrouve le lieu à partir de son nom et de son adresse (ou de coordonnées si locate: "coordinates").
const byAddress = !useOsm && mapCfg.locate !== "coordinates";
const mapQuery = encodeURIComponent(mapCfg.query || `${b.name}, ${addressInline}`).replace(/'/g, "%27");
const gPlace = byAddress ? mapQuery : `${lat},${lon}`;
const span = 0.006 * 2 ** (16 - zoom);
const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - span},${lat - span * 0.6},${lon + span},${lat + span * 0.6}&layer=mapnik&marker=${lat},${lon}`;
const googleEmbed = `https://maps.google.com/maps?q=${gPlace}&z=${zoom}&hl=fr&output=embed`;
const mapEmbed = useOsm ? osmEmbed : googleEmbed;
const mapProviderName = useOsm ? "OpenStreetMap" : "Google Maps";
const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
const googleLink = `https://www.google.com/maps/search/?api=1&query=${gPlace}`;
const mapLink = useOsm ? osmLink : googleLink;
const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${useOsm || !byAddress ? `${lat},${lon}` : mapQuery}`;

const titleText =
  c.seo.title || `${b.name} | Restaurant à ${b.address.city}`;
const canonical = c.siteUrl;
const ogImageUrl = new URL(c.seo.ogImage, c.siteUrl).href;

// ---------- Fichiers générés : favicon et image de partage ------------
// Logo : src/assets/logo-m.svg (un seul tracé, rempli en "currentColor" : il prend la couleur du texte).
// Supprimez ou remplacez ce fichier pour changer de logo ; sans lui, le site retombe sur un losange doré.
const logoPath = path.join(src, "assets", "logo-m.svg");
const logoRaw = existsSync(logoPath) ? await readFile(logoPath, "utf8") : "";
const logoViewBox = (logoRaw.match(/viewBox="([^"]+)"/) || [])[1] || "";
const logoInner = (logoRaw.match(/<svg[^>]*>([\s\S]*)<\/svg>/) || [])[1] || "";
const hasLogo = Boolean(logoViewBox && logoInner);
const logoSymbol = hasLogo
  ? `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="logo-m" viewBox="${logoViewBox}">${logoInner}</symbol></svg>`
  : "";
const logoMark = (cls) =>
  hasLogo ? `<svg class="${cls}" viewBox="${logoViewBox}" aria-hidden="true" focusable="false"><use href="#logo-m"/></svg>` : "";

const [lvbW, lvbH] = logoViewBox.split(" ").slice(2).map(Number);

// Écran de chargement (voir loader dans site.config.mjs)
const LD = { enabled: true, seconds: 2.6, oncePerSession: false, messages: [], ...(c.loader || {}) };
const loaderOn = LD.enabled !== false;
const loaderSeconds = Math.max(0.8, Number(LD.seconds) || 2.6);
// La classe is-loading est posée avant l'affichage (pas de flash du site) et retirée d'office
// après 9 s même si le script principal échouait.
const loaderHeadScript = loaderOn
  ? `<script>(function(d){var r=d.documentElement;r.classList.add("js");try{if(${LD.oncePerSession ? "true" : "false"}&&sessionStorage.getItem("loader-seen"))return}catch(e){}r.classList.add("is-loading");setTimeout(function(){r.classList.remove("is-loading")},9000)})(document)</script>`
  : '<script>document.documentElement.classList.add("js")</script>';
const loaderMarkup = loaderOn
  ? `<div class="loader" data-loader data-seconds="${loaderSeconds}" data-once="${LD.oncePerSession ? "true" : "false"}" data-messages="${esc((LD.messages || []).join("|"))}" role="status" aria-live="polite" aria-label="Chargement du site">
  <div class="loader__panel loader__panel--top"></div>
  <div class="loader__panel loader__panel--bottom"></div>
  <div class="loader__stage">
    <i class="loader__corner loader__corner--tl"></i><i class="loader__corner loader__corner--tr"></i><i class="loader__corner loader__corner--bl"></i><i class="loader__corner loader__corner--br"></i>
    <div class="loader__hud" aria-hidden="true">
      <svg class="loader__rings" viewBox="0 0 220 220" focusable="false">
        <circle class="lr lr--ticks" cx="110" cy="110" r="106" pathLength="360"/>
        <circle class="lr lr--orbit" cx="110" cy="110" r="94" pathLength="360"/>
        <circle class="lr lr--track" cx="110" cy="110" r="80"/>
        <circle class="lr lr--progress" cx="110" cy="110" r="80" pathLength="100" data-loader-ring/>
        <circle class="lr lr--inner" cx="110" cy="110" r="68" pathLength="360"/>
      </svg>
      ${hasLogo ? `<div class="loader__core"><svg class="loader__mark loader__mark--ghost" viewBox="${logoViewBox}" focusable="false"><use href="#logo-m"/></svg><svg class="loader__mark loader__mark--fill" viewBox="${logoViewBox}" focusable="false"><use href="#logo-m"/></svg><span class="loader__scan"></span></div>` : `<div class="loader__core"><span class="loader__initial">${esc(b.name.trim()[0].toUpperCase())}</span></div>`}
    </div>
    <p class="loader__name">${esc(b.name)}</p>
    <p class="loader__count"><span data-loader-count>000</span><small>%</small></p>
    <p class="loader__status" data-loader-status>${esc((LD.messages || [])[0] || "Chargement")}</p>
    <button class="loader__skip" type="button" data-loader-skip>Passer</button>
  </div>
</div>`
  : "";
const faviconSvg = hasLogo
  ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${T.primary}"/><svg x="${(64 - (38 * lvbW) / lvbH) / 2}" y="13" width="${(38 * lvbW) / lvbH}" height="38" viewBox="${logoViewBox}" fill="${T.accent}">${logoInner}</svg></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${T.primary}"/><circle cx="46" cy="18" r="6" fill="${T.accent}"/><text x="30" y="46" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="34" fill="${primaryInk}">${esc(b.name.trim()[0].toUpperCase())}</text></svg>`;

function wrapWords(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function ogSvg() {
  const nameLines = wrapWords(b.name, 20).slice(0, 3);
  const nameText = nameLines
    .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 96}">${esc(l)}</tspan>`)
    .join("");
  const tagY = 250 + (nameLines.length - 1) * 96 + 90;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${T.primary}"/>${hasLogo ? `<svg x="${1090 - (400 * lvbW) / lvbH}" y="115" width="${(400 * lvbW) / lvbH}" height="400" viewBox="${logoViewBox}" fill="${T.accent}">${logoInner}</svg>` : `<circle cx="1010" cy="170" r="150" fill="${T.accent}"/><circle cx="1090" cy="520" r="90" fill="${T.secondary}"/>`}<rect x="80" y="110" width="96" height="10" fill="${T.accent}"/><text x="80" y="250" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="84" fill="${primaryInk}">${nameText}</text><text x="80" y="${tagY}" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="${primarySoft}">${esc(b.tagline)}</text></svg>`;
}

// ---------- Composants HTML -------------------------------------------
const statusHtml = (extra = "") => `
<p class="status ${extra}" data-status data-state="unknown">
  <span class="status__dot" aria-hidden="true"></span>
  <span class="status__text" data-status-text>Horaires détaillés ci-dessous</span>
</p>`;

const hoursRows = c.hours
  .map((d, i) => {
    const value = d.ranges.length
      ? d.ranges.map(([a, z]) => `${fmtTime(a)} – ${fmtTime(z)}`).join(" et ")
      : "Fermé";
    return `<tr data-day="${i}" style="--r:${i}"><th scope="row">${esc(d.day)}</th><td>${value}</td></tr>`;
  })
  .join("\n");

const hoursData = JSON.stringify({
  timezone: c.timezone,
  days: c.hours.map((d) => ({ label: d.day, ranges: d.ranges })),
}).replace(/</g, "\\u003c");

// Carte : onglets par catégorie, plats avec filtres de régime
const M = c.menu;
const dietLabel = Object.fromEntries(M.filters.map((f) => [f.id, f.label]));

const dishHtml = (d) => `
<li class="dish" data-diets="${esc((d.diets || []).join(" "))}">
  <div class="dish__head">
    <h4 class="dish__name">${esc(d.name)}</h4>
    <span class="dish__dots" aria-hidden="true"></span>
    <span class="dish__price">${esc(d.price)}<span class="visually-hidden"> ${esc(M.currency)}</span></span>
  </div>
  <p class="dish__desc">${esc(d.desc)}</p>
  ${(d.diets || []).length ? `<ul class="dish__diets" aria-label="Régimes">${d.diets.map((x) => `<li>${esc(dietLabel[x] || x)}</li>`).join("")}</ul>` : ""}
</li>`;

const menuTabs = M.categories
  .map(
    (cat, i) =>
      `<button class="tab" type="button" role="tab" id="tab-${esc(cat.id)}" aria-controls="panel-${esc(cat.id)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(cat.label)}</button>`
  )
  .join("");

const menuPanels = M.categories
  .map(
    (cat, i) => `
<div class="menu__panel" role="tabpanel" id="panel-${esc(cat.id)}" aria-labelledby="tab-${esc(cat.id)}" ${i === 0 ? "" : "data-later"} tabindex="0">
  <h3 class="menu__cat">${esc(cat.label)}</h3>
  <ul class="dishes">${cat.items.map(dishHtml).join("")}</ul>
  <p class="menu__empty" hidden>Aucun plat de cette catégorie ne correspond à ce filtre.</p>
</div>`
  )
  .join("\n");

const filterButtons = M.filters
  .map(
    (f) =>
      `<button class="chip" type="button" aria-pressed="false" data-filter="${esc(f.id)}">${esc(f.label)}</button>`
  )
  .join("");

const tasting = M.tasting;

const caveGroups = c.cave.groups
  .map(
    (g, i) => `
<div class="cave__group reveal" style="--i:${i}">
  <h3 class="cave__title">${esc(g.title)}</h3>
  <ul class="wines">
    ${g.items
      .map(
        (w) => `<li class="wine">
      <div class="wine__head"><span class="wine__name">${esc(w.name)}</span><span class="wine__dots" aria-hidden="true"></span><span class="wine__price">${esc(w.price)}<span class="visually-hidden"> ${esc(M.currency)}</span></span></div>
      <p class="wine__detail">${esc(w.detail)}</p>
    </li>`
      )
      .join("\n    ")}
  </ul>
</div>`
  )
  .join("\n");

const galleryItems = c.gallery.items
  .map(
    (g, i) => `
<figure class="shot shot--${esc(g.size)} reveal" data-reveal="zoom" style="--i:${i}">
  <img src="${esc(g.src)}" alt="${esc(g.alt)}" width="${Number(g.width) || 800}" height="${Number(g.height) || (g.size === "l" ? 800 : 600)}"${g.position ? ` style="object-position:${esc(g.position)}"` : ""} loading="lazy" decoding="async">
  <figcaption>${esc(g.caption)}</figcaption>
</figure>`
  )
  .join("\n");

const R = c.reservation;
const heroPhotos = (c.hero.photos || []).filter((p) => p && p.src);
const heroMode =
  c.hero.background === "video" && c.hero.video && c.hero.video.src
    ? "video"
    : c.hero.background === "ambiance" || !heroPhotos.length
      ? "ambiance"
      : "arche";
const HV = heroMode === "video" ? c.hero.video : null;
// Lumières de l'arrière-plan « ambiance » : x, y (en %), taille (rem), intensité, durée et retard (s).
const ORBS = [
  [78, 12, 22, 0.34, 38, 0], [90, 46, 16, 0.26, 44, -9], [64, 58, 28, 0.2, 52, -21],
  [84, 78, 20, 0.3, 41, -14], [52, 18, 9, 0.28, 33, -5], [70, 34, 7, 0.4, 29, -17],
  [95, 20, 6, 0.36, 31, -2], [58, 84, 8, 0.3, 36, -26], [40, 70, 12, 0.14, 47, -11],
  [28, 10, 14, 0.12, 49, -30], [8, 62, 18, 0.1, 55, -19], [76, 66, 5, 0.42, 27, -8],
];
const orbsHtml = ORBS.map(([x, y, sz, o, t, d]) => `<i class="orb" style="--x:${x}%;--y:${y}%;--s:${sz}rem;--o:${o};--t:${t}s;--d:${d}s"></i>`).join("");
const heroBg = HV
  ? ""
  : `<div class="hero__bg" aria-hidden="true">${orbsHtml}${heroMode === "ambiance" && hasLogo ? `<svg class="hero__mark" viewBox="${logoViewBox}" focusable="false"><use href="#logo-m"/></svg>` : ""}<span class="hero__grain"></span></div>`;
const heroArch =
  heroMode === "arche"
    ? `<div class="hero__arch" data-hero style="--i:1" data-slides data-seconds="${Number(c.hero.photoSeconds) > 1 ? Number(c.hero.photoSeconds) : 5}">
      <span class="hero__arch-frame" aria-hidden="true"></span>
      <div class="hero__arch-photos">${heroPhotos
        .map(
          (p, i) =>
            `<figure class="slide${i === 0 ? " is-active" : ""}"${i === 0 ? "" : ' aria-hidden="true"'}><img src="${esc(p.src)}" alt="${esc(p.alt || "")}"${p.position ? ` style="object-position:${esc(p.position)}"` : ""} width="${Number(p.width) || 800}" height="${Number(p.height) || 1000}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`
        )
        .join("")}</div>
    </div>`
    : "";
const slotOptions = R.slots
  .map(
    (s) =>
      `<optgroup label="${esc(s.label)}">${s.times.map((t) => `<option value="${esc(t)}">${fmtTime(t)}</option>`).join("")}</optgroup>`
  )
  .join("");
const guestOptions = Array.from(
  { length: R.maxGuests },
  (_, i) => `<option value="${i + 1}"${i === 1 ? " selected" : ""}>${i + 1} ${i === 0 ? "adulte" : "adultes"}</option>`
).join("");
const childOptions = Array.from(
  { length: (R.maxChildren ?? 6) + 1 },
  (_, i) => `<option value="${i}"${i === 0 ? " selected" : ""}>${i === 0 ? "Aucun enfant" : i + (i === 1 ? " enfant" : " enfants")}</option>`
).join("");
const via = R.whatsapp && R.sendVia !== "email" ? "whatsapp" : "email";
const hasWhatsapp = Boolean(R.whatsapp);

const values = c.about.values
  .map(
    (v, i) => `
<div class="values__item reveal" style="--i:${i}">
  <dt>${esc(v.title)}</dt>
  <dd>${esc(v.text)}</dd>
</div>`
  )
  .join("\n");

// Icônes des réseaux sociaux : dessin simple, couleur de marque au survol
const SOCIALS = {
  facebook: { color: "#1877F2", label: "Facebook", svg: '<path fill="currentColor" stroke="none" d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.7V13h2.7v8h3.1z"/>' },
  instagram: { color: "#E4405F", label: "Instagram", svg: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>' },
  whatsapp: { color: "#25D366", label: "WhatsApp", svg: '<path d="M20 11.5A8.5 8.5 0 0 1 7.4 19L3.5 20.5l1.3-3.9A8.5 8.5 0 1 1 20 11.5z"/><path fill="currentColor" stroke="none" d="M9.2 8.3c-.3.5-.3 1.3.3 2.4 1 1.9 2.6 3.1 4.2 3.7.8.3 1.4.1 1.8-.5l.2-.6-1.8-.9-.7.7c-.8-.3-1.8-1.3-2.2-2.2l.6-.7-.8-1.8z"/>' },
  tiktok: { color: "#FE2C55", label: "TikTok", svg: '<path fill="currentColor" stroke="none" d="M16.2 3c.3 2.2 1.7 3.7 3.8 3.9v3a6.9 6.9 0 0 1-3.8-1.2v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.4V3h2.9z"/>' },
  youtube: { color: "#FF0000", label: "YouTube", svg: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path fill="currentColor" stroke="none" d="M10 9.3v5.4l4.7-2.7z"/>' },
  x: { color: "#FFFFFF", label: "X", svg: '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15"/>' },
  linkedin: { color: "#0A66C2", label: "LinkedIn", svg: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M12 16v-5.5m0 2.5c0-3 4-3 4 0v3"/><circle cx="8" cy="7.8" r=".6" fill="currentColor"/>' },
};
const socialKey = (s) => {
  const t = (s.href + " " + s.label).toLowerCase();
  if (/facebook|fb\.com/.test(t)) return "facebook";
  if (/instagram/.test(t)) return "instagram";
  if (/whatsapp|wa\.me/.test(t)) return "whatsapp";
  if (/tiktok/.test(t)) return "tiktok";
  if (/youtube|youtu\.be/.test(t)) return "youtube";
  if (/twitter|x\.com|\bx\b/.test(t)) return "x";
  if (/linkedin/.test(t)) return "linkedin";
  return null;
};

const socialLinks = c.social
  .filter((s) => s.href)
  .map((s) => {
    const icon = SOCIALS[socialKey(s)];
    if (!icon) {
      return '<li><a class="social social--text" href="' + esc(s.href) + '" target="_blank" rel="noopener noreferrer">' + esc(s.label) + '<span class="visually-hidden"> (nouvel onglet)</span></a></li>';
    }
    return '<li><a class="social" style="--brand:' + icon.color + '" href="' + esc(s.href) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label || icon.label) + ' (nouvel onglet)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + icon.svg + '</svg></a></li>';
  })
  .join("");

const navItems = c.nav
  .map(
    (n) =>
      `<li><a class="nav__link" href="${esc(n.href)}">${esc(n.label)}</a></li>`
  )
  .join("");

// Assiette dessinée au trait (animée au chargement)
const plateSvg = `<svg class="plate" viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Dessin au trait d'une assiette entre une fourchette et un couteau">
  <circle class="draw" pathLength="1" style="--d:0" cx="200" cy="200" r="118"/>
  <circle class="draw" pathLength="1" style="--d:1" cx="200" cy="200" r="86"/>
  <path class="draw" pathLength="1" style="--d:2" d="M200 160c-22 10-34 28-30 48 20-2 34-14 40-34m-10-14c14-4 30-2 40 8-6 20-22 32-44 34"/>
  <path class="draw" pathLength="1" style="--d:3" d="M52 110v70c0 10 8 16 16 16v110m0-196v66m-16-66v50m32-50v50"/>
  <path class="draw" pathLength="1" style="--d:4" d="M348 110c-16 18-22 46-18 86h18v110m0-196v196"/>
</svg>`;

// ---------- Données structurées (Google) ------------------------------
const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const sameAs = c.social
  .map((s) => s.href)
  .filter((href) => {
    try {
      return new URL(href).pathname.length > 1;
    } catch {
      return false;
    }
  });

const jsonLd = {
  "@context": "https://schema.org",
  "@type": b.schemaType,
  name: b.name,
  description: b.description,
  url: canonical,
  image: ogImageUrl,
  telephone: b.phone,
  email: b.email,
  servesCuisine: b.cuisine,
  priceRange: b.priceRange,
  acceptsReservations: "True",
  hasMenu: new URL("#carte", canonical).href,
  address: {
    "@type": "PostalAddress",
    streetAddress: b.address.street,
    addressLocality: b.address.city,
    addressCountry: b.address.countryCode,
    ...(b.address.postalCode ? { postalCode: b.address.postalCode } : {}),
  },
  ...(byAddress ? {} : { geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lon } }),
  openingHoursSpecification: c.hours.flatMap((d, i) =>
    d.ranges.map(([opens, closes]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayNames[i],
      opens,
      closes,
    }))
  ),
  ...(sameAs.length ? { sameAs } : {}),
};

// ---------- Fichiers CSS / JS (avec empreinte anti-cache) -------------
const css = await readFile(path.join(src, "styles.css"), "utf8");
const js = await readFile(path.join(src, "main.js"), "utf8");
const cssUrl = `assets/styles.css?v=${hash(css)}`;
const jsUrl = `assets/main.js?v=${hash(js)}`;

const fontsUrl =
  "https://fonts.googleapis.com/css2?family=Marcellus&family=Public+Sans:wght@400;500;600&display=swap";

// ---------- Page principale -------------------------------------------
const indexHtml = `<!doctype html>
<html lang="${esc(c.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titleText)}</title>
<meta name="description" content="${esc(b.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="${T.primary}">

<meta property="og:type" content="website">
<meta property="og:locale" content="${esc(c.locale)}">
<meta property="og:site_name" content="${esc(b.name)}">
<meta property="og:title" content="${esc(titleText)}">
<meta property="og:description" content="${esc(b.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(c.seo.ogImageAlt)}">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontsUrl}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${fontsUrl}"></noscript>
<link rel="stylesheet" href="${cssUrl}">
<style id="theme">${themeCss}</style>
${loaderHeadScript}
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body id="top">
${logoSymbol}
${loaderMarkup}
<a class="skip-link" href="#contenu">Aller au contenu</a>

<!-- ============ EN-TÊTE ============ -->
<header class="site-header${T.header === "dark" ? " site-header--dark" : ""}">
  <div class="container header__inner">
    <a class="logo" href="#top" aria-label="${esc(b.name)}, retour en haut de page">${logoMark("logo__mark")}<span>${esc(b.name)}</span></a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Ouvrir le menu">
      <span class="burger__bars" aria-hidden="true"></span>
    </button>
    <nav class="nav" id="site-nav" aria-label="Navigation principale">
      <ul class="nav__list">
        ${navItems}
        <li class="nav__cta"><a class="btn btn--accent btn--gold btn--sm" href="#reserver">Réserver</a></li>
      </ul>
    </nav>
  </div>
</header>

<main id="contenu">

<!-- ============ ACCUEIL ============ -->
<section class="hero${HV ? " hero--video" : " hero--ambiance"}${heroMode === "arche" ? " hero--arche" : ""}" aria-labelledby="hero-title">
  ${heroBg}
  ${HV ? `<video class="hero__video" autoplay muted playsinline webkit-playsinline disablepictureinpicture disableremoteplayback preload="auto" data-respect-reduce="${HV.respectReducedMotion ? "true" : "false"}" ${HV.loop ? "loop " : ""}poster="${esc(HV.poster || "")}" aria-hidden="true" tabindex="-1" data-hero-video>
    <source src="${esc(HV.src)}" type="video/mp4">${HV.srcWebm ? `
    <source src="${esc(HV.srcWebm)}" type="video/webm">` : ""}
  </video>` : ""}
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="hero__kicker" data-hero style="--i:-1">${esc(b.cuisine)} · ${esc(b.address.city)}</p>
      <h1 class="hero__title" id="hero-title">${splitWords(c.hero.title)}</h1>
      <p class="hero__lead" data-hero style="--i:0">${esc(c.hero.subtitle)}</p>
      <div class="hero__actions" data-hero style="--i:1">
        <a class="btn btn--accent btn--gold" href="${esc(c.hero.primaryCta.href)}">${esc(c.hero.primaryCta.label)}</a>
        <a class="btn btn--outline-light" href="${esc(c.hero.secondaryCta.href)}">${esc(c.hero.secondaryCta.label)}</a>
      </div>
    </div>
    ${heroArch}
  </div>
  <div class="container">
    <div class="hero__info" data-hero style="--i:2">
      ${statusHtml()}
      <p class="hero__hours" data-today-hours></p>
      <address class="hero__address">${esc(addressInline)}</address>
    </div>
  </div>
</section>

<!-- ============ LA MAISON ============ -->
<section class="section" id="maison" aria-labelledby="about-title">
  <div class="container about">
    <div class="about__text reveal">
      <h2 class="section__title reveal" id="about-title">${esc(c.about.title)}</h2>
      ${c.about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n      ")}
    </div>
    <figure class="about__media reveal" data-reveal="wipe">
      <img src="${esc(c.about.image.src)}" alt="${esc(c.about.image.alt)}" width="${c.about.image.width}" height="${c.about.image.height}" loading="lazy" decoding="async">
      <figcaption class="about__caption"><strong>${esc(c.about.chef.name)}</strong><span>${esc(c.about.chef.role)}</span></figcaption>
    </figure>
    <dl class="values">
      ${values}
    </dl>
  </div>
</section>

<!-- ============ LA CARTE ============ -->
<section class="section section--tint" id="carte" aria-labelledby="carte-title">
  <div class="container">
    <div class="section__head">
      <h2 class="section__title reveal" id="carte-title">${esc(M.title)}</h2>
      <p class="section__intro">${esc(M.intro)}</p>
    </div>

    <div class="menu" data-menu>
      <div class="menu__bar">
        <div class="tabs" role="tablist" aria-label="Catégories de la carte">${menuTabs}</div>
        <div class="filters" role="group" aria-label="Filtrer par régime">
          <span class="filters__label">Filtrer :</span>${filterButtons}
        </div>
      </div>
      <p class="visually-hidden" role="status" aria-live="polite" data-menu-status></p>
      ${menuPanels}
      <p class="menu__note">${esc(M.note)} Les mentions de régime sont indicatives : signalez toute allergie avant de commander.</p>
    </div>

    <aside class="tasting reveal" data-reveal="zoom" aria-labelledby="tasting-title">
      <div class="tasting__copy">
        <h3 class="tasting__title" id="tasting-title">${esc(tasting.title)}</h3>
        <p>${esc(tasting.text)}</p>
        <ol class="tasting__courses">${tasting.courses.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
      </div>
      <div class="tasting__side">
        <p class="tasting__price">${esc(tasting.price)} <span>${esc(M.currency)} par personne</span></p>
        <a class="btn btn--accent btn--gold" href="#reserver" data-tasting>${esc(tasting.cta)}</a>
      </div>
    </aside>
  </div>
</section>

<!-- ============ LA CAVE ============ -->
<section class="section section--primary" id="cave" aria-labelledby="cave-title">
  <div class="container">
    <div class="section__head">
      <h2 class="section__title reveal" id="cave-title">${esc(c.cave.title)}</h2>
      <p class="section__intro">${esc(c.cave.intro)}</p>
    </div>
    <div class="cave">
      ${caveGroups}
    </div>
    <p class="cave__note">${esc(c.cave.note)}</p>
  </div>
</section>

<!-- ============ GALERIE ============ -->
<section class="section" id="galerie" aria-labelledby="galerie-title">
  <div class="container">
    <div class="section__head">
      <h2 class="section__title reveal" id="galerie-title">${esc(c.gallery.title)}</h2>
      <p class="section__intro">${esc(c.gallery.intro)}</p>
    </div>
    <div class="gallery">
      ${galleryItems}
    </div>
  </div>
</section>

<!-- ============ RÉSERVATION ============ -->
<section class="section section--primary" id="reserver" aria-labelledby="reserver-title">
  <div class="container contact">
    <div class="contact__intro">
      <h2 class="section__title reveal" id="reserver-title">${esc(R.title)}</h2>
      <p>${esc(R.intro)}</p>
      <p>${esc(R.groupNote)}</p>
      <div class="contact__direct">
        <p>Vous préférez appeler ?</p>
        <a class="btn btn--outline-light btn--call" href="tel:${esc(b.phoneLink)}" data-call aria-label="Appeler ${esc(b.name)} au ${esc(b.phone)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>Appeler</a>
      </div>
    </div>

    <form class="form reveal" data-reveal="right" id="contact-form" novalidate
      action="${esc(c.formspreeEndpoint || `mailto:${b.email}`)}" method="post"
      ${c.formspreeEndpoint ? "" : 'enctype="text/plain"'}
      data-endpoint="${esc(c.formspreeEndpoint)}" data-mailto="${esc(b.email)}" data-phone="${esc(b.phone)}"
      data-whatsapp="${esc(R.whatsapp)}" data-via="${via}" data-name="${esc(b.name)}" data-timezone="${esc(c.timezone)}">
      <div class="form__row form__row--two">
        <div class="field">
          <label for="f-date">Date</label>
          <input id="f-date" name="date" type="date" required aria-describedby="f-date-err">
          <p class="field__error" id="f-date-err" hidden></p>
        </div>
        <div class="field">
          <label for="f-time">Heure</label>
          <select id="f-time" name="time" required aria-describedby="f-time-err">
            <option value="">Choisir</option>${slotOptions}
          </select>
          <p class="field__error" id="f-time-err" hidden></p>
        </div>
      </div>
      <div class="form__row form__row--two">
        <div class="field">
          <label for="f-guests">Adultes</label>
          <select id="f-guests" name="guests">${guestOptions}</select>
        </div>
        <div class="field">
          <label for="f-children">Enfants</label>
          <select id="f-children" name="children">${childOptions}</select>
        </div>
      </div>
      <div class="field">
        <label for="f-name">Nom</label>
        <input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="f-name-err">
        <p class="field__error" id="f-name-err" hidden></p>
      </div>
      <div class="field">
        <label for="f-phone">Téléphone <span class="field__optional">(autre numéro joignable et/ou WhatsApp)</span></label>
        <input id="f-phone" name="phone" type="tel" autocomplete="tel" required aria-describedby="f-phone-err">
        <p class="field__error" id="f-phone-err" hidden></p>
      </div>
      <div class="field">
        <label for="f-email">E-mail <span class="field__optional">(facultatif)</span></label>
        <input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="f-email-err">
        <p class="field__error" id="f-email-err" hidden></p>
      </div>
      <div class="field">
        <label for="f-message">Allergies, occasion, demande particulière <span class="field__optional">(facultatif)</span></label>
        <textarea id="f-message" name="message" rows="3"></textarea>
      </div>
      <div class="field field--check">
        <input id="f-consent" name="consent" type="checkbox" required aria-describedby="f-consent-err">
        <label for="f-consent">J'accepte que ces informations soient utilisées pour traiter ma réservation.</label>
        <p class="field__error" id="f-consent-err" hidden></p>
      </div>
      <div class="hp" aria-hidden="true"><label>Ne pas remplir ce champ<input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
      <input type="hidden" name="_subject" value="Demande de réservation : ${esc(b.name)}">
      <div class="form__actions">
        ${via === "whatsapp"
          ? `<button class="btn btn--accent btn--gold" type="submit" data-submit>Demander cette table sur WhatsApp</button>
        <button class="btn btn--ghost" type="button" data-alt-send="email">Envoyer par e-mail</button>`
          : `<button class="btn btn--accent btn--gold" type="submit" data-submit>Demander cette table</button>
        ${hasWhatsapp ? '<button class="btn btn--ghost" type="button" data-alt-send="whatsapp">Envoyer par WhatsApp</button>' : ""}`}
      </div>
      <p class="form__status" role="status" aria-live="polite" data-form-status></p>
      <p class="form__hint">Votre table est garantie une fois notre confirmation reçue.${via === "whatsapp" ? " WhatsApp s'ouvre avec votre message déjà rédigé : il vous reste à l'envoyer." : ""}</p>
    </form>
  </div>
</section>

<!-- ============ VENIR ============ -->
<section class="section section--surface" id="venir" aria-labelledby="venir-title">
  <div class="container visit">
    <div class="visit__info">
      <h2 class="section__title reveal" id="venir-title">${esc(c.visit.title)}</h2>
      <p class="section__intro">${esc(c.visit.intro)}</p>
      ${statusHtml("status--onlight")}
      <table class="hours reveal" data-reveal="rows">
        <caption class="visually-hidden">Horaires d'ouverture</caption>
        <tbody>
          ${hoursRows}
        </tbody>
      </table>
      <ul class="infos reveal">
        <li>
          <span class="infos__label">Adresse</span>
          <address>${esc(addressInline)}</address>
        </li>
        <li>
          <span class="infos__label">Téléphone</span>
          <a href="tel:${esc(b.phoneLink)}" data-call>${esc(b.phone)}</a>
        </li>
        <li>
          <span class="infos__label">E-mail</span>
          <a href="mailto:${esc(b.email)}">${esc(b.email)}</a>
        </li>
        ${c.visit.access ? `<li><span class="infos__label">Accès</span><span>${esc(c.visit.access)}</span></li>` : ""}
      </ul>
    </div>

    <div class="visit__map">
      <div class="map reveal" data-reveal="zoom" data-map data-autoload="${mapCfg.autoLoad ? "true" : "false"}" data-src="${esc(mapEmbed)}" data-title="Carte : emplacement de ${esc(b.name)}">
        <div class="map__placeholder">
          <p data-map-text>La carte est fournie par ${mapProviderName}.${mapCfg.autoLoad ? " Elle s'affiche dans un instant." : " Elle se charge à la demande pour préserver votre navigation."}</p>
          <button class="btn btn--primary" type="button" data-map-load>Afficher la carte</button>
          <a href="${esc(mapLink)}" target="_blank" rel="noopener noreferrer">Ouvrir dans ${mapProviderName}<span class="visually-hidden"> (nouvel onglet)</span></a>
        </div>
      </div>
      <p class="map__links"><a href="${esc(mapLink)}" target="_blank" rel="noopener noreferrer">Ouvrir dans ${mapProviderName}<span class="visually-hidden"> (nouvel onglet)</span></a><a href="${esc(directionsLink)}" target="_blank" rel="noopener noreferrer">Calculer l'itinéraire<span class="visually-hidden"> (nouvel onglet)</span></a></p>
    </div>
  </div>
  <script type="application/json" id="hours-data">${hoursData}</script>
</section>

</main>

<!-- ============ PIED DE PAGE ============ -->
<footer class="site-footer">
  <div class="container footer__grid">
    <div class="footer__brand">
      ${logoMark("footer__mark")}
      <p class="footer__logo">${esc(b.name)}</p>
      <p>${esc(b.tagline)}</p>
    </div>
    <div>
      <h2 class="footer__title">Coordonnées</h2>
      <ul class="footer__list">
        <li><address>${esc(addressInline)}</address></li>
        <li><a href="tel:${esc(b.phoneLink)}" data-call>${esc(b.phone)}</a></li>
        <li><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></li>
      </ul>
    </div>
    ${socialLinks ? `<div><h2 class="footer__title">Réseaux sociaux</h2><ul class="footer__social">${socialLinks}</ul></div>` : ""}
  </div>

  <div class="container footer__legal">
    <details id="mentions">
      <summary>Mentions légales</summary>
      <div class="legal">
        <p><strong>Éditeur du site :</strong> ${esc(c.legal.publisher)}, ${esc(addressInline)}. ${esc(c.legal.registration)}.</p>
        ${c.legal.director ? `<p><strong>Responsable de la publication :</strong> ${esc(c.legal.director)}.</p>` : ""}
        <p><strong>Contact :</strong> ${esc(b.email)}, ${esc(b.phone)}.</p>
        ${c.legal.host ? `<p><strong>Hébergement :</strong> ${esc(c.legal.host)}.</p>` : ""}
        <p><strong>Données personnelles :</strong> ${esc(c.legal.dataNotice)}</p>
        <p><strong>Cookies :</strong> ${esc(c.legal.cookiesNotice)}</p>
      </div>
    </details>
    <p class="footer__copy">© ${new Date().getFullYear()} ${esc(c.legal.publisher)}. Tous droits réservés.</p>
  </div>
</footer>

<div class="call-toast" data-call-toast role="status" aria-live="polite" hidden>
  <span>Appelez le <strong data-call-number>${esc(b.phone)}</strong></span>
  <button type="button" data-call-copy>Copier</button>
</div>

<div class="reserve-bar" data-reserve-bar>
  <a class="btn btn--accent btn--gold" href="#reserver">${esc(R.title)}</a>
  <a class="btn btn--outline-light" href="tel:${esc(b.phoneLink)}" data-call aria-label="Appeler ${esc(b.name)} au ${esc(b.phone)}">Appeler</a>
</div>

<script src="${jsUrl}" defer></script>
</body>
</html>
`;

// ---------- Page 404 --------------------------------------------------
const notFoundHtml = `<!doctype html>
<html lang="${esc(c.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page introuvable | ${esc(b.name)}</title>
<link rel="icon" href="${esc(new URL("assets/favicon.svg", c.siteUrl).href)}" type="image/svg+xml">
<link rel="stylesheet" href="${esc(new URL(cssUrl, c.siteUrl).href)}">
<style id="theme">${themeCss}</style>
</head>
<body>
<main class="notfound">
  <div class="container">
    <h1 class="hero__title">Cette page n'existe pas.</h1>
    <p class="hero__lead">Le lien est peut-être ancien ou mal saisi. Retournez à l'accueil pour retrouver la carte, nos horaires et la réservation.</p>
    <p><a class="btn btn--accent" href="${esc(c.siteUrl)}">Retour à l'accueil</a></p>
  </div>
</main>
</body>
</html>
`;

// ---------- Écriture des fichiers -------------------------------------
await mkdir(out, { recursive: true });
await rm(path.join(out, "assets"), { recursive: true, force: true });
await cp(path.join(src, "assets"), path.join(out, "assets"), { recursive: true });

// Recolore les illustrations SVG fournies avec la palette du thème
const recolor = {
  "#0f3d3a": T.primary,
  "#f2a93b": T.accent,
  "#dce8e3": T.secondary,
  "#f6f7f4": T.background,
  "#44605a": inkSoft,
};
for (const file of await readdir(path.join(out, "assets"))) {
  if (!file.endsWith(".svg")) continue;
  const svgPath = path.join(out, "assets", file);
  const svg = (await readFile(svgPath, "utf8")).replace(
    /#[0-9a-fA-F]{6}\b/g,
    (hex) => recolor[hex.toLowerCase()] || hex
  );
  await writeFile(svgPath, svg);
}

await writeFile(path.join(out, "assets", "favicon.svg"), faviconSvg);
await writeFile(path.join(out, "assets", "styles.css"), css);
await writeFile(path.join(out, "assets", "main.js"), js);

// Image de partage : votre fichier src/assets/og-image.png est conservé ;
// sinon une image aux couleurs du thème est générée (outil rsvg-convert).
const ogName = path.basename(c.seo.ogImage);
if (!existsSync(path.join(src, "assets", ogName))) {
  const tmpSvg = path.join(out, "assets", "og-image.svg");
  await writeFile(tmpSvg, ogSvg());
  try {
    execFileSync("rsvg-convert", ["-w", "1200", "-h", "630", "-o", path.join(out, "assets", ogName), tmpSvg]);
  } catch {
    console.warn(
      "! Image de partage non générée (rsvg-convert absent). Ajoutez un fichier 1200x630 nommé src/assets/" + ogName
    );
  }
  await rm(tmpSvg, { force: true });
}

await writeFile(path.join(out, "index.html"), indexHtml);
await writeFile(path.join(out, "404.html"), notFoundHtml);
await writeFile(path.join(out, ".nojekyll"), "");
await writeFile(
  path.join(out, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap.xml", c.siteUrl).href}\n`
);
await writeFile(
  path.join(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${esc(canonical)}</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n  </url>\n</urlset>\n`
);

const files = await readdir(out);
console.log(`Site généré dans ${path.relative(root, out) || "."}/ (${files.length} entrées à la racine).`);

console.log("\nContrastes de la palette (WCAG AA : 4,5 : 1 minimum pour le texte) :");
for (const [label, fg, bg, min] of contrastChecks) {
  const ratio = contrast(fg, bg);
  console.log(`  ${ratio >= min ? "OK" : "!!"}  ${ratio.toFixed(1).padStart(4)} : 1  ${label}`);
}
if (inkSoft.toLowerCase() !== inkSoftOriginal.toLowerCase()) {
  console.log(
    `\nNote : le texte secondaire ${inkSoftOriginal} est assombri en ${inkSoft} pour atteindre 4,5 : 1.`
  );
}
const failures = contrastChecks.filter(([, fg, bg, min]) => contrast(fg, bg) < min);
if (failures.length) {
  console.warn(`\n! ${failures.length} contraste(s) sous le seuil : ajustez le bloc theme de site.config.mjs.`);
}
