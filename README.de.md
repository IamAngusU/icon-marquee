# Icon Marquee

<a href="https://github.com/IamAngusU/icon-marquee"><img src="docs/assets/icon-marquee-lockup.svg" alt="Icon Marquee — ein Pixelherz in Bewegung" width="360"></a>

Bring Bewegung in deinen Tech-Stack. Für GitHub-Profile, Projekt-READMEs und Websites.
Wähle aus 1.041 Icons, ergänze eigene Logos oder lasse ein öffentliches GitHub-Repo
die Sprachen aktuell halten. Kein Installieren, kein Konto.

Aufbauend auf **[gian-gg/icon-marquee](https://github.com/gian-gg/icon-marquee)**.
Icons von [skills-icons](https://github.com/syvixor/skills-icons). [Credits](ATTRIBUTION.md).

<p align="center"><a href="README.md"><img src="docs/assets/readme-language-en.svg" height="40" alt="Read this README in English"></a></p>
<p align="center">
  <a href="https://angusu.de/icon-marquee/"><img src="docs/assets/generator.svg" height="40" alt="Generator öffnen"></a>
  <a href="docs/usage.md"><img src="docs/assets/readme/repo-runtime.svg" height="40" alt="Browser und SVG"></a>
  <a href="LICENSE"><img src="docs/assets/readme/repo-license.svg" height="40" alt="MIT"></a>
</p>

[![Echter Icon-Marquee-Export](docs/assets/icon-marquee_readme.svg)](https://github.com/IamAngusU/icon-marquee)

## In drei Schritten

1. [Generator öffnen](https://angusu.de/icon-marquee/) und Icons oder **GitHub Auto** wählen.
2. Größe, Tempo und Effekte anpassen; SVG herunterladen oder Live-URL kopieren.
3. Das Bild in deine README einfügen:

```md
[![Mein Tech-Stack](https://angusu.de/icon-marquee/api/OWNER/REPOSITORY.svg)](https://github.com/IamAngusU/icon-marquee)
```

## Generator in Aktion

[![Browseraufnahme des Generators](docs/assets/generator-preview.png)](docs/assets/generator-demo.mp4)

[Kurzes Video ansehen](https://angusu.de/icon-marquee/generator-demo.mp4) · [Repository-Kopie](docs/assets/generator-demo.mp4).
Echte Browseraufnahme; SVGs bleiben das bewegte, direkt einbettbare Ergebnis.

## Live oder als feste Datei

**GitHub Auto** liest GitHubs öffentliche Sprachstatistik. Frameworks, Datenbanken
und Tools kannst du zusätzlich anheften. Ein Live-Bild benötigt weder Workflow
noch Token oder Bot-Commits im konsumierenden Repository. Es aktualisiert sich
hinter einem Cache; Bildproxies können Änderungen verzögert anzeigen.

**Fester Export:** SVG herunterladen, ins Repository legen und lokal einbetten:

```md
[![Mein Tech-Stack](./icon-marquee.svg)](https://github.com/IamAngusU/icon-marquee)
```

Ein SVG passt sich hellem und dunklem Design an. Shuffle, Glint, Holo und YAML-
Presets sind optional. Eigene Logos werden lokal verarbeitet und bleiben im Browser.
Bei reduzierter Bewegung steht die Leiste still.

**Verfügbarkeit:** angusu.de ist ein Best-Effort-Dienst ohne Uptime-SLA.
Bei vorübergehendem GitHub-Ausfall kann die laufende Instanz ihren letzten
erfolgreichen Sprachstand bis zu sieben Tage liefern. Nach Neustart ohne Cache,
bei unbekanntem Repo oder Ausfall von angusu.de kann das Live-Bild fehlen.
Ein eingecheckter SVG-Export benötigt den Dienst nicht.

## Lokal starten

Bun 1.4.2 oder neuer:

```sh
bun install --frozen-lockfile
bun run dev
```

Öffne `http://127.0.0.1:3000`. [Bedienung und Deployment](docs/usage.md) ·
[Architektur](docs/architecture.md) · [Beitragen](docs/conventions.md) · [MIT](LICENSE).
