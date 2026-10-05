export const styles = `
.advanced { margin: 20px 0; padding-top: 16px; border-top: 1px solid #dbe2ee; }
.advanced summary { cursor: pointer; font-weight: 600; font-size: 13px; }
.advanced .input-label { margin-top: 16px; }
.advanced { grid-column: 1 / -1; }
.effect-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.effect-pair select, select.field-input { font-family: var(--sans); padding-inline: 8px; }
.import-panel { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--line); }
.import-panel summary { cursor: pointer; font-size: 12px; color: var(--blue); }
.import-panel.drag-over { outline: 2px dashed var(--blue); outline-offset: 5px; }
#project-source { display: block; width: 100%; margin: 10px 0; padding: 10px; border: 1px solid var(--line); border-radius: 7px; font: 11px/1.5 ui-monospace, monospace; resize: vertical; max-height: 160px; }
.icon-tooltip { position: fixed; z-index: 20; background: #fff; color: #182344; box-shadow: 0 3px 16px #0003; padding: 5px 9px; border-radius: 5px; font: 12px/1.4 var(--sans); pointer-events: none; max-width: 220px; overflow-wrap: anywhere; }
#preview use:focus-visible { outline: 3px solid #9cc2ff; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 16px 0; }
.yaml-panel { margin-top: 14px; }
.yaml-panel textarea { box-sizing: border-box; width: 100%; margin-top: 12px; padding: 12px; border: 1px solid #dbe2ee; border-radius: 8px; background: #f0f3fa; font: 11px/1.7 ui-monospace, monospace; color: #1b2845; resize: vertical; }
:root {
  color-scheme: light;
  --canvas: #eef2f8;
  --paper: #ffffff;
  --ink: #182344;
  --muted: #63708a;
  --blue: #345fe9;
  --line: #dce3ef;
  --navy: #182441;
  --display: "Space Grotesk", "Segoe UI", sans-serif;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 24px; }
body { margin: 0; background: var(--canvas); color: var(--ink); font: 15px/1.5 var(--sans); -webkit-font-smoothing: antialiased; }
button, input, textarea { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
button { cursor: pointer; color: inherit; }
button:disabled { cursor: not-allowed; opacity: .45; }
button { transition: background .15s, color .15s, border-color .15s; }
a { color: inherit; text-decoration: none; }
a:hover { color: var(--blue); }
button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, summary:focus-visible { outline: 3px solid #7c9cff; outline-offset: 3px; }
button:active:not(:disabled) { transform: translateY(1px); }
h1, h2, p { margin: 0; }
h1, h2 { font-family: var(--display); }
.wrap { width: min(1264px, calc(100% - 96px)); margin-inline: auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding-block: 30px; }
.brand { display: inline-flex; align-items: center; gap: 10px; font: 600 21px var(--display); letter-spacing: -.7px; }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--blue); color: white; font-size: 32px; line-height: 1; }
nav { display: flex; align-items: center; gap: 30px; font-size: 13px; font-weight: 500; }
.nav-count { margin-left: 6px; color: var(--muted); font-size: 11px; }
.intro { padding: 44px 0 42px; display: flex; justify-content: space-between; align-items: flex-end; gap: 48px; }
.intro-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); margin-bottom: 16px; }
.small-mark { width: 7px; height: 7px; border-radius: 50%; background: var(--blue); }
h1 { font-size: clamp(44px, 5.1vw, 68px); font-weight: 500; letter-spacing: -3.8px; line-height: 1.03; }
.intro-copy { max-width: 310px; color: var(--muted); font-size: 16px; line-height: 1.65; padding-bottom: 6px; }
.composer { background: var(--paper); border-radius: 20px; box-shadow: 0 14px 55px #2031530a; border: 1px solid var(--line); overflow: clip; }
.preview-panel { background: var(--navy); color: #c6d1e6; position: sticky; top: 0; z-index: 2; }
.preview-toolbar, .preview-footer { display: flex; justify-content: space-between; align-items: center; padding: 19px 28px; gap: 18px; }
.live-label { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.live-label > span { width: 6px; height: 6px; border-radius: 50%; background: #9cc2ff; box-shadow: 0 0 0 4px #9cc2ff14; }
.preview-actions { display: flex; align-items: center; gap: 8px; }
.swatch { width: 19px; height: 19px; border-radius: 50%; border: 2px solid transparent; padding: 0; }
.swatch.light { background: #f5f7fb; }
.swatch.dark { background: #182441; border-color: #7d8da8; }
.swatch[aria-pressed="true"] { outline: 1px solid #a8bbdf; outline-offset: 3px; }
.preview-pause { border: 1px solid #ffffff30; background: transparent; color: #dee6f4; border-radius: 6px; padding: 4px 12px; font-size: 11px; margin-left: 12px; min-width: 64px; }
.preview-pause:hover { background: #ffffff12; }
.preview-stage { min-height: 148px; padding: 28px; display: flex; align-items: center; justify-content: center; overflow: hidden; color-scheme: dark; transition: background .2s; }
.preview-stage[data-surface="light"] { background: #f8fafc; color: var(--ink); color-scheme: light; }
#preview { max-width: 100%; min-width: 0; line-height: 0; }
#preview > svg { display: block; max-width: 100%; height: auto; overflow: hidden; }
.empty-preview { color: inherit; font-size: 14px; }
.preview-footer { font-size: 11px; color: #a9b8d2; padding-block: 15px 20px; }
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) 350px; }
.selection-panel { padding: 28px 30px 32px; min-width: 0; }
.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 7px; }
h2 { font-weight: 600; font-size: 17px; letter-spacing: -.4px; }
.section-heading h2 span { display: inline-block; margin-left: 5px; font-family: var(--sans); font-size: 11px; border-radius: 4px; background: #edf1fa; padding: 2px 6px; color: var(--muted); vertical-align: middle; }
.text-button { background: transparent; border: 0; font-size: 11px; color: var(--muted); padding: 4px; }
.text-button:hover { color: var(--blue); }
.section-help, .field-help { font-size: 11px; color: var(--muted); }
.selected-icons { display: flex; flex-wrap: wrap; gap: 7px; margin: 18px 0 22px; padding: 0; list-style: none; min-height: 37px; }
.selected-icons li { display: inline-flex; align-items: center; gap: 7px; max-width: 100%; border: 1px solid var(--line); border-radius: 7px; padding: 6px 5px 6px 8px; font-size: 12px; background: #f9fbff; cursor: grab; }
.selected-icons li > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selected-icons li:focus-visible { outline: 3px solid #7c9cff; outline-offset: 2px; }
.selected-icons img { width: 23px; height: 23px; }
.selected-icons button { background: transparent; border: 0; padding: 0 4px; font-size: 17px; line-height: 1; color: var(--muted); }
.selected-icons li.dragging { opacity: .4; }
.selected-icons li.drag-over { border-color: var(--blue); }
.input-label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 7px; }
.field-input { border: 1px solid var(--line); border-radius: 7px; width: 100%; min-width: 0; padding: 11px 12px; font: 12px/1.5 ui-monospace, Consolas, monospace; color: var(--ink); background: var(--paper); }
.field-input[aria-invalid="true"] { border-color: #b54343; }
.field-help { margin-top: 7px; }
.presets { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 18px; font-size: 10px; }
.presets > span { color: var(--muted); margin-right: 4px; }
.presets button { border: 1px solid var(--line); border-radius: 5px; padding: 5px 9px; background: #fff; font-size: 10px; }
.presets button:hover { background: #eef3ff; border-color: #bdcdfa; }
.library { margin-top: 30px; border-top: 1px solid var(--line); padding-top: 26px; }
#results-count { font-size: 11px; color: var(--muted); }
.results-count { margin: -4px 0 12px; }
.upload-button { border: 1px solid #b9caf8; border-radius: 6px; background: #f0f4ff; color: #3158b1; padding: 7px 10px; font-size: 12px; white-space: nowrap; }
.upload-button:hover { background: #e3ebff; }
#logo-status:empty { display: none; }
.local-logo-styles { margin-top: 12px; border: 1px solid var(--line); border-radius: 7px; padding: 10px; }
.local-logo-styles summary { cursor: pointer; font-size: 12px; }
.local-logo-style { display: grid; grid-template-columns: minmax(0,1fr) 140px; gap: 12px; align-items: center; margin-top: 12px; }
.local-logo-style label { display: block; font-size: 12px; overflow-wrap: anywhere; }
.local-logo-style small { display: block; color: var(--muted); font-size: 10px; margin-top: 2px; }
.local-logo-style select { padding-block: 7px; }
.search-field { display: flex; align-items: center; gap: 9px; border: 1px solid var(--line); background: #f9fbff; border-radius: 8px; padding: 9px 12px; margin: 16px 0; color: var(--muted); }
.search-field > span { font-size: 22px; line-height: 1; }
.search-field input { width: 100%; min-width: 0; border: 0; background: transparent; font-size: 12px; color: var(--ink); }
.search-field input:focus { outline: none; }
.search-field:focus-within { border-color: var(--blue); box-shadow: 0 0 0 2px #345fe918; }
kbd { font: 11px var(--sans); border: 1px solid var(--line); border-radius: 3px; padding: 0 5px; }
.catalog { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; align-content: start; height: 388px; overflow-y: auto; overscroll-behavior: contain; padding: 4px; margin: -4px; }
.icon-option { position: relative; display: flex; flex-direction: column; align-items: center; gap: 9px; min-width: 0; padding: 13px 4px 10px; background: #fff; border: 1px solid var(--line); border-radius: 8px; }
.icon-option img { width: 35px; height: 35px; }
.icon-option span { display: block; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
.icon-option:hover { background: #f3f6ff; border-color: #a7bef6; }
.icon-option[aria-pressed="true"] { background: #f0f4ff; border-color: #96afea; }
.icon-option[aria-pressed="true"]::after { content: "✓"; position: absolute; right: 4px; top: 3px; color: var(--blue); font-size: 9px; font-weight: bold; }
.catalog-pages { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; font-size: 11px; color: var(--muted); }
.catalog-pages button { border: 1px solid var(--line); border-radius: 5px; background: #fff; padding: 7px 10px; font-size: 11px; }
.settings-panel { border-left: 1px solid var(--line); background: #fafbfe; padding: 28px 26px; }
.segmented { display: flex; border-radius: 7px; border: 1px solid var(--line); background: #edf1f7; padding: 3px; gap: 3px; margin-top: 16px; }
.segmented button { flex: 1; font-size: 12px; padding: 7px 10px; border-radius: 4px; border: 0; background: transparent; color: var(--muted); white-space: nowrap; }
.segmented button[aria-pressed="true"] { background: #fff; color: var(--ink); box-shadow: 0 1px 4px #1e335918; }
.control { margin-top: 20px; }
.control label { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 500; }
.control output { color: var(--muted); font-size: 10px; font-variant-numeric: tabular-nums; font-weight: 400; }
input[type="range"] { display: block; width: 100%; height: 18px; margin: 9px 0 0; accent-color: var(--blue); cursor: pointer; }
input[type="range"]:disabled { cursor: not-allowed; opacity: .35; }
.direction-control { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; font-size: 11px; }
.compact { margin: 0; padding: 2px; }
.compact button { padding: 5px 10px; font-size: 11px; }
.motion-note { font-size: 10px; color: var(--muted); margin-top: 18px; }
.export-panel { border-top: 1px solid var(--line); margin-top: 26px; padding-top: 24px; }
.export-tabs { display: flex; gap: 20px; margin-top: 15px; border-bottom: 1px solid var(--line); }
.export-tabs button { background: transparent; border: 0; border-bottom: 2px solid transparent; color: var(--muted); font-size: 11px; padding: 0 0 8px; }
.export-tabs button[aria-pressed="true"] { color: var(--blue); border-color: var(--blue); }
#snippet { display: block; width: 100%; resize: vertical; min-height: 110px; max-height: 250px; border: 1px solid var(--line); background: #f0f3f9; border-radius: 6px; margin-top: 13px; padding: 12px; font: 10px/1.7 ui-monospace, Consolas, monospace; color: #455372; overflow-wrap: anywhere; }
.primary-button { width: 100%; display: flex; justify-content: space-between; align-items: center; border: 0; border-radius: 7px; background: var(--blue); color: #fff; padding: 11px 13px; font-size: 12px; font-weight: 500; margin-top: 10px; }
.primary-button:hover:not(:disabled) { background: #244cd1; }
.primary-button > span { font-size: 18px; }
.secondary-actions { display: flex; gap: 10px; justify-content: space-between; margin-top: 12px; }
.secondary-actions button { background: transparent; border: 0; font-size: 11px; padding: 3px 0; color: #455372; }
.secondary-actions button:hover { color: var(--blue); }
.status { font-size: 11px; color: #3158b1; margin-top: 12px; overflow-wrap: anywhere; }
.status:empty { margin: 0; }
.status[data-error="true"] { color: #a52c37; }
.export-note { color: var(--muted); font-size: 10px; line-height: 1.6; margin-top: 15px; }
.reference { display: grid; grid-template-columns: 1fr 1.7fr; gap: 75px; padding: 64px 16px 52px; }
.reference-intro h2 { font-size: 31px; font-weight: 500; line-height: 1.15; letter-spacing: -1.2px; }
.reference-intro p { font-size: 12px; color: var(--muted); max-width: 250px; margin-top: 16px; }
.reference-intro > a { display: inline-block; margin-top: 16px; font-size: 12px; color: var(--blue); }
.endpoint { border-radius: 7px; padding: 17px 20px; background: #e4eaf5; }
.endpoint > code { font: 12px ui-monospace, Consolas, monospace; }
.endpoint p { font-size: 11px; color: var(--muted); margin-top: 7px; }
.parameter-list { margin: 18px 0 0; }
.parameter-list > div { display: grid; grid-template-columns: 130px 1fr; gap: 10px; padding: 8px 0; font-size: 11px; }
.parameter-list dt { font-weight: 600; }
.parameter-list dd { margin: 0; color: var(--muted); }
.footer { display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid #d3dceb; padding-block: 23px 34px; font-size: 10px; color: var(--muted); }
.footer a { text-decoration: underline; text-underline-offset: 2px; }
.footer-dot { margin-inline: 8px; opacity: .5; }
.skip-link { position: fixed; left: 16px; top: -80px; z-index: 9; background: #fff; border: 2px solid var(--blue); border-radius: 5px; padding: 10px; }
.skip-link:focus { top: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.noscript { position: fixed; bottom: 0; background: #fff; border: 1px solid var(--line); width: 100%; padding: 16px; }
[hidden] { display: none !important; }
@media (min-width: 1500px) { .intro { padding-top: 55px; } }
@media (max-width: 1100px) {
  .wrap { width: calc(100% - 56px); }
  .workspace { grid-template-columns: minmax(0,1fr) 315px; }
  .selection-panel { padding: 26px 22px; }
  .settings-panel { padding: 26px 22px; }
  .catalog { grid-template-columns: repeat(5, minmax(0,1fr)); }
}
@media (max-width: 800px) {
  .preview-panel { position: static; }
  .wrap { width: calc(100% - 36px); }
  nav { gap: 15px; font-size: 11px; }
  .nav-count { display: none; }
  .intro { gap: 24px; padding: 30px 0; }
  h1 { font-size: 48px; letter-spacing: -2.5px; }
  .intro-label { font-size: 10px; }
  .intro-copy { max-width: 230px; font-size: 13px; }
  .workspace { grid-template-columns: 1fr; }
  .settings-panel { border-left: 0; border-top: 1px solid var(--line); display: grid; grid-template-columns: 1fr 1fr; gap: 0 28px; }
  .settings-panel > h2, .settings-panel > .segmented, .direction-control, .motion-note { grid-column: 1 / -1; }
  .export-panel { grid-column: 1 / -1; }
  .catalog { grid-template-columns: repeat(6,minmax(0,1fr)); }
  .reference { gap: 30px; padding: 45px 5px; grid-template-columns: 1fr 1.5fr; }
  .footer { flex-direction: column; gap: 8px; }
}
@media (max-width: 520px) {
  .topbar { padding-block: 22px; }
  .brand { font-size: 18px; }
  .brand-mark { width: 28px; height: 28px; font-size: 26px; border-radius: 8px; }
  nav a:first-child { display: none; }
  nav { gap: 14px; font-size: 10px; }
  .intro { display: block; padding: 24px 0 30px; }
  h1 { font-size: 49px; }
  .intro-copy { margin-top: 18px; max-width: 310px; font-size: 13px; }
  .composer { border-radius: 13px; }
  .preview-toolbar, .preview-footer { padding-inline: 17px; }
  .preview-stage { min-height: 125px; padding: 25px 17px; }
  .preview-footer { font-size: 9px; }
  .preview-footer > span:last-child { max-width: 120px; text-align: right; }
  .selection-panel { padding: 22px 16px; }
  .settings-panel { padding: 22px 18px; gap: 0 22px; }
  .section-help { font-size: 10px; }
  .catalog { grid-template-columns: repeat(4,minmax(0,1fr)); }
  .reference { grid-template-columns: 1fr; gap: 25px; padding: 38px 4px; }
  .reference-intro h2 br { display: none; }
  .reference-intro h2 { font-size: 26px; }
  .reference-intro p { max-width: 300px; }
  .parameter-list > div { grid-template-columns: 110px 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;
