import { createHash } from "node:crypto";
import { config } from "../config";
import { iconCount } from "../utils/registry";
import { script } from "./script";
import { styles } from "./styles";

export const scriptHash = `sha256-${createHash("sha256").update(script).digest("base64")}`;

export const landingPage = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Icon Marquee — put your stack in motion</title>
<meta name="description" content="Compose an animated tech stack with over 1,000 icons. Set the pace, preview your design, and export an SVG or a README-ready snippet." />
<meta name="color-scheme" content="light" />
<link rel="icon" href="/logo.svg" type="image/svg+xml" />
<link rel="alternate" type="text/plain" href="/llms.txt" title="API usage guide" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${styles}</style>
</head>
<body>
<a class="skip-link" href="#composer">Skip to composer</a>
<header class="topbar wrap">
  <a class="brand" href="/" aria-label="Icon Marquee home"><span class="brand-mark" aria-hidden="true">≋</span>icon marquee</a>
  <nav aria-label="Main navigation"><a href="#library">Icon library <span class="nav-count">${iconCount}</span></a><a href="#reference">API guide</a><a href="${config.landing.repoUrl}">GitHub ↗</a></nav>
</header>
<main class="wrap">
  <section class="intro" aria-labelledby="page-title">
    <div><p class="intro-label"><span aria-hidden="true" class="small-mark"></span>A little movement. A lot of personality.</p><h1 id="page-title">Your stack.<br />In good motion.</h1></div>
    <p class="intro-copy">Turn the tools you love into a seamless icon loop. Make it yours, then drop it into your README or website.</p>
  </section>

  <section class="composer" id="composer" aria-label="Marquee composer">
    <div class="preview-panel">
      <div class="preview-toolbar"><div class="live-label"><span aria-hidden="true"></span>Live preview</div><div class="preview-actions" role="group" aria-label="Preview background"><button class="swatch light" data-surface="light" aria-label="Light preview" aria-pressed="false"></button><button class="swatch dark" data-surface="dark" aria-label="Dark preview" aria-pressed="true"></button><button id="pause" class="preview-pause" type="button" aria-pressed="false">Pause</button></div></div>
      <div id="stage" class="preview-stage" data-surface="dark">
        <img id="preview" src="/v1/marquee?i=${config.landing.playgroundIcons}&amp;width=760&amp;height=64&amp;gap=16&amp;speed=40" alt="Animated preview of your selected tech icons" width="760" height="64" />
        <div class="empty-preview" id="empty-preview" hidden>Add a few icons to get things moving.</div>
      </div>
      <div class="preview-footer"><span id="preview-info">SVG. Sharp at every size.</span><span>Automatic light &amp; dark icons</span></div>
    </div>

    <div class="workspace">
      <div class="selection-panel">
        <div class="section-heading"><h2>Your lineup <span id="selection-count">6</span></h2><button id="clear" class="text-button" type="button">Clear all</button></div>
        <p class="section-help" id="reorder-help">Drag to reorder. Or focus an icon and press Alt + arrow keys.</p>
        <ul id="selected" class="selected-icons" aria-label="Selected icons" aria-describedby="reorder-help"></ul>
        <label class="input-label" for="icons">Icon names</label>
        <input id="icons" class="field-input" value="${config.landing.playgroundIcons}" autocomplete="off" spellcheck="false" aria-describedby="names-help" />
        <p class="field-help" id="names-help">Comma-separated. Short names like js, ts, react and py work too.</p>
        <div class="presets" role="group" aria-label="Stack presets"><span>Start with</span><button data-preset="frontend" type="button">Frontend</button><button data-preset="backend" type="button">Backend</button><button data-preset="creative" type="button">Creative</button><button data-preset="ai" type="button">AI tools</button></div>
        <section id="library" class="library" aria-labelledby="library-heading">
          <div class="section-heading"><h2 id="library-heading">Find your icons</h2><span id="results-count">${iconCount} icons</span></div>
          <label class="search-field"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search ${iconCount} icons…" aria-label="Search icons by name or alias" autocomplete="off" /><kbd>/</kbd></label>
          <div id="catalog" class="catalog" aria-label="Available icons"></div>
          <p id="catalog-empty" class="field-help" hidden>No icons match. Try another name or a short name like “py”.</p>
          <button id="show-more" type="button" class="show-more">Show more icons</button>
        </section>
      </div>

      <aside class="settings-panel" aria-labelledby="settings-heading">
        <h2 id="settings-heading">Make it yours</h2>
        <div class="segmented" role="group" aria-label="Output mode"><button type="button" data-mode="marquee" aria-pressed="true">Marquee</button><button type="button" data-mode="icons" aria-pressed="false">Static row</button></div>
        <div class="control"><label for="width">Canvas width <output id="width-value" for="width">760 px</output></label><input id="width" type="range" min="80" max="1600" step="1" value="760" /></div>
        <div class="control"><label for="height">Icon size <output id="height-value" for="height">64 px</output></label><input id="height" type="range" min="20" max="128" step="1" value="64" /></div>
        <div class="control"><label for="gap">Spacing <output id="gap-value" for="gap">16 px</output></label><input id="gap" type="range" min="0" max="96" step="1" value="16" /></div>
        <div class="control"><label for="speed">Scroll speed <output id="speed-value" for="speed">40 px/s</output></label><input id="speed" type="range" min="5" max="200" step="1" value="40" /></div>
        <div class="direction-control"><span>Direction</span><div class="segmented compact" role="group" aria-label="Scroll direction"><button data-direction="left" type="button" aria-pressed="true">← Left</button><button data-direction="right" type="button" aria-pressed="false">Right →</button></div></div>
        <p class="motion-note">Respects reduced-motion preferences automatically.</p>
        <div class="export-panel">
          <h2>Take it with you</h2>
          <div class="export-tabs" role="group" aria-label="Embed format"><button data-format="markdown" type="button" aria-pressed="true">Markdown</button><button data-format="html" type="button" aria-pressed="false">HTML</button><button data-format="url" type="button" aria-pressed="false">URL</button></div>
          <label class="sr-only" for="snippet">Embed code</label><textarea id="snippet" readonly rows="4" spellcheck="false"></textarea>
          <button id="copy" class="primary-button" type="button">Copy Markdown <span aria-hidden="true">⧉</span></button>
          <div class="secondary-actions"><button id="download" type="button">Download SVG ↓</button><button id="share" type="button">Copy editor link ↗</button></div>
          <p id="status" class="status" role="status" aria-live="polite"></p>
          <p class="export-note">Downloads work anywhere. Live embeds need your own running instance.</p>
        </div>
      </aside>
    </div>
  </section>

  <section id="reference" class="reference" aria-labelledby="reference-heading">
    <div class="reference-intro"><h2 id="reference-heading">One URL.<br /> Endless loops.</h2><p>No account, no API key, no JavaScript in your embed. Just an SVG.</p><a href="/llms.txt">Full API guide ↗</a></div>
    <div class="reference-content">
      <div class="endpoint"><code>/v1/marquee?i=js,ts,react</code><p>A seamless, animated row. Use <code>/v1/icons</code> for a static one.</p></div>
      <dl class="parameter-list"><div><dt>i</dt><dd>Icon names or aliases, in order. Up to 100.</dd></div><div><dt>width</dt><dd>Window width, 1–3840 px. Marquee only.</dd></div><div><dt>height / gap</dt><dd>Icon size, 20–128 px. Spacing, 0–96 px.</dd></div><div><dt>speed / direction</dt><dd>5–200 px/s. Scroll left or right.</dd></div></dl>
    </div>
  </section>
</main>
<footer class="wrap footer"><span>Icon Marquee <span class="footer-dot">/</span> Made for your next README.</span><span>Based on <a href="https://github.com/gian-gg/icon-marquee">gian-gg/icon-marquee</a>. Icons by <a href="https://github.com/syvixor/skills-icons">skills-icons</a>. MIT.</span></footer>
<noscript><p class="noscript">The interactive editor needs JavaScript. You can still generate an image directly at <a href="/v1/marquee?i=js,ts,react">/v1/marquee?i=js,ts,react</a>.</p></noscript>
<script>${script}</script>
</body>
</html>`;
