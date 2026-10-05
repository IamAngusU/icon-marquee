import { createHash } from "node:crypto";
import { config } from "../config";
import { iconCount } from "../utils/registry";
import { createClientScript, script } from "./script";
import { styles } from "./styles";

export const scriptHash = `sha256-${createHash("sha256").update(script).digest("base64")}`;

export function createLandingPage(staticSite = false) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Icon Marquee — put your stack in motion</title>
<meta name="description" content="Compose an animated tech stack with over 1,000 icons. Set the pace, preview your design, and export an SVG or a README-ready snippet." />
<meta name="color-scheme" content="light" />
<link rel="icon" href="./logo.svg" type="image/svg+xml" />
<link rel="alternate" type="text/plain" href="/llms.txt" title="API usage guide" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${styles}</style>
</head>
<body>
<a class="skip-link" href="#composer">Skip to composer</a>
<header class="topbar wrap">
  <a class="brand" href="./" aria-label="Icon Marquee home"><span class="brand-mark" aria-hidden="true"><svg class="brand-heart" viewBox="-0.5 -1 6 6" shape-rendering="crispEdges"><rect x="1" y="0" width="1" height="1"/><rect x="3" y="0" width="1" height="1"/><rect x="0" y="1" width="1" height="1"/><rect x="2" y="1" width="1" height="1"/><rect x="4" y="1" width="1" height="1"/><rect x="1" y="2" width="1" height="1"/><rect x="3" y="2" width="1" height="1"/><rect x="2" y="3" width="1" height="1"/></svg></span>icon marquee</a>
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
        <div id="preview" role="img" aria-label="Live preview of your selected icons"></div>
        <div class="empty-preview" id="empty-preview" hidden>Add a few icons to get things moving.</div>
      </div>
      <div class="preview-footer"><span id="preview-info">SVG. Sharp at every size.</span><span>Automatic light &amp; dark icons</span></div>
    </div>

    <div class="workspace">
      <div class="selection-panel">
        <details class="import-panel"><summary>Open an existing design</summary><p class="field-help">Drop an Icon Marquee SVG or HTML export here, or paste it below. Import replaces this design. Everything stays local.</p><input id="project-file" type="file" accept=".svg,.html,.htm" hidden /><div class="secondary-actions"><button id="open-project" type="button">Choose SVG / HTML</button></div><label class="sr-only" for="project-source">SVG or HTML to import</label><textarea id="project-source" rows="3" spellcheck="false" placeholder="Paste your export…"></textarea><button id="import-project" type="button" class="upload-button">Import design</button><p class="field-help" id="import-status" role="status"></p></details>
        <div class="section-heading"><h2>Your lineup <span id="selection-count">6</span></h2><button id="clear" class="text-button" type="button">Clear all</button></div>
        <p class="section-help" id="reorder-help">Drag to reorder. Or focus an icon and press Alt + arrow keys.</p>
        <ul id="selected" class="selected-icons" aria-label="Selected icons" aria-describedby="reorder-help"></ul>
        <label class="input-label" for="icons">Icon names</label>
        <input id="icons" class="field-input" value="${config.landing.playgroundIcons}" autocomplete="off" spellcheck="false" aria-describedby="names-help" />
        <p class="field-help" id="names-help">Comma-separated. Short names like js, ts, react and py work too.</p>
        <div class="presets" role="group" aria-label="Stack presets"><span>Start with</span><button data-preset="frontend" type="button">Frontend</button><button data-preset="backend" type="button">Backend</button><button data-preset="creative" type="button">Creative</button><button data-preset="ai" type="button">AI tools</button></div>
        <section id="library" class="library" aria-labelledby="library-heading">
          <div class="section-heading"><h2 id="library-heading">Find your icons</h2><button id="add-logos" class="upload-button" type="button">＋ Your logos</button></div>
          <input id="logo-files" type="file" accept=".svg,.png,.jpg,.jpeg,.webp" multiple hidden />
          <p class="field-help">SVG, PNG, JPG or WebP. Up to 2 MB each. Files stay in your browser.</p>
          <p id="logo-status" class="field-help" role="status"></p>
          <details id="local-logo-styles" class="local-logo-styles" hidden><summary>Your logo colors</summary><p class="field-help">Auto adapts simple black &amp; white logos. All uploads get matching rounded corners. Original colors skips recoloring.</p><div id="local-logo-options"></div></details>
          <label class="search-field"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search ${iconCount} icons…" aria-label="Search icons by name or alias" autocomplete="off" /><kbd>/</kbd></label>
          <p id="results-count" class="results-count">${iconCount} icons</p>
          <div id="catalog" class="catalog" aria-label="Available icons"></div>
          <p id="catalog-empty" class="field-help" hidden>No icons match. Try another name or a short name like “py”.</p>
          <div class="catalog-pages" role="group" aria-label="Icon library pages"><button id="previous-icons" type="button">← Previous</button><span id="catalog-page" aria-live="polite"></span><button id="next-icons" type="button">Next →</button></div>
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
        <div class="direction-control"><span>Order</span><div class="segmented compact" role="group" aria-label="Icon order"><button data-order="repeat" type="button" aria-pressed="true">Repeat</button><button data-order="shuffle" type="button" aria-pressed="false">Shuffle</button></div></div>
        <p id="shuffle-note" class="motion-note" hidden>Fresh picks. Recent icons sit out. Duplicate logos count once.</p>
        <details class="advanced"><summary>Effects &amp; behavior</summary>
          <div class="control"><label for="edge-fade">Ghost edges <output id="edge-fade-value">24 px</output></label><input type="range" id="edge-fade" min="0" max="96" value="24" /></div>
          <label class="checkbox-label"><input type="checkbox" id="tooltips" /> Icon names on hover</label>
          <label class="input-label" for="effect">Finish</label><select class="field-input" id="effect"><option value="none">Original</option><option value="glint">Glint</option><option value="chrome">Chrome</option><option value="holo">Holo</option></select>
          <div id="finish-controls" hidden>
            <div class="effect-pair"><div><label class="input-label" for="effect-area">Apply to</label><select class="field-input" id="effect-area"><option value="surface">Whole icon</option><option value="border">Border only</option></select></div><div><label class="input-label" for="effect-timing">Sweep pattern</label><select class="field-input" id="effect-timing"><option value="stagger">Staggered</option><option value="random">Random paths</option><option value="sync">Together</option></select></div></div>
            <label class="input-label" for="effect-coverage">Which icons?</label><select class="field-input" id="effect-coverage"><option value="all">All icons</option><option value="some">Occasional accents</option><option value="selected">Only these icons…</option></select>
            <div id="effect-targets" hidden><label class="input-label" for="effect-icons">Icon names</label><input class="field-input" id="effect-icons" placeholder="js, react, custom-1" autocomplete="off" /><p class="field-help">Use names from your lineup.</p></div>
            <div class="control"><label for="intensity">Intensity <output id="intensity-value">35%</output></label><input id="intensity" type="range" min="0" max="100" value="35" /></div>
            <div class="control"><label for="effect-duration">Sweep duration <output id="effect-duration-value">5 s</output></label><input id="effect-duration" type="range" min="1" max="20" step=".5" value="5" /></div>
            <div class="control"><label for="effect-interval">Between sweeps <output id="effect-interval-value">3 s</output></label><input id="effect-interval" type="range" min="0" max="30" step=".5" value="3" /></div>
            <div class="control" id="variation-control"><label for="effect-variation">Random speed variation <output id="effect-variation-value">55%</output></label><input id="effect-variation" type="range" min="0" max="100" value="55" /></div>
          </div>
          <label class="input-label" for="pause-style">Pause &amp; resume</label><select class="field-input" id="pause-style"><option value="instant">Instant</option><option value="ease">Ease in / out</option><option value="bezier">Custom Bézier</option></select>
          <label class="checkbox-label"><input type="checkbox" id="hover-pause" /> Pause on hover</label>
          <p class="field-help">Hover names: editor &amp; inline HTML only. Pause controls: editor only.</p>
          <details class="yaml-panel"><summary>YAML preset</summary><label class="sr-only" for="effect-yaml">Effect YAML</label><textarea id="effect-yaml" spellcheck="false" rows="8"></textarea><div class="secondary-actions"><button id="apply-preset" type="button">Apply preset</button><button id="copy-preset" type="button">Copy YAML</button></div><p class="field-help" id="preset-status" role="status">Flat YAML settings. No scripts or custom CSS.</p></details>
        </details>
        <div class="export-panel">
          <h2>Take it with you</h2>
          <div class="export-tabs" role="group" aria-label="Embed format"><button data-format="markdown" type="button" aria-pressed="true">Markdown</button><button data-format="html" type="button" aria-pressed="false">HTML</button><button data-format="url" type="button" aria-pressed="false">URL</button></div>
          <label class="sr-only" for="snippet">Embed code</label><textarea id="snippet" readonly rows="4" spellcheck="false"></textarea>
          <button id="copy" class="primary-button" type="button">Copy Markdown <span aria-hidden="true">⧉</span></button>
          <div class="secondary-actions"><button id="download" type="button">Download SVG ↓</button><button id="share" type="button">Copy editor link ↗</button></div>
          <div class="secondary-actions"><button id="download-html" type="button">Download HTML ↓</button><span class="field-help">Both files can be reopened.</span></div>
          <p id="status" class="status" role="status" aria-live="polite"></p>
          <p id="export-note" class="export-note">Download to use in any repo. Live URL embeds need a publicly reachable instance.</p>
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
<script>${staticSite ? createClientScript(true) : script}</script>
</body>
</html>`;
}

export const landingPage = createLandingPage();
