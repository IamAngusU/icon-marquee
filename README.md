# Icon Marquee

Your tech stack, in motion. A small visual composer for animated SVGs that work in GitHub READMEs and on the web.

![Icon Marquee — Your stack. In good motion.](docs/assets/hero.svg)

- **Make it yours.** Pick from 1,041 icons or add your own logos.
- **Dial in the motion.** Reorder, resize, reverse, shuffle. Pause and resume right where you left off.
- **Take one file.** Download a self-contained SVG. No account, tracking or JavaScript in your embed.

## In your README

Download `icon-marquee.svg`, put it beside your README, and paste:

```md
![My tech stack](./icon-marquee.svg)
```

That's it. No hosted service needed. [Grab an example SVG](docs/assets/icon-marquee.svg).

## Run it

With [Bun](https://bun.sh) 1.4.2+:

```sh
bun install --frozen-lockfile
bun dev
```

Open [localhost:3000](http://localhost:3000). No env setup, database or frontend build.

Custom logos stay in your browser and are embedded as PNGs in the download. Live shuffle keeps picking fresh rounds; exported SVGs loop after 16 shuffled rounds. Reduced-motion preferences are respected.

[Usage & API](docs/usage.md) · [Architecture](docs/architecture.md) · [Contributing](docs/conventions.md)

---

Built on [gian-gg/icon-marquee](https://github.com/gian-gg/icon-marquee). Icons by [skills-icons](https://github.com/syvixor/skills-icons). [MIT](LICENSE) · [Credits](ATTRIBUTION.md).
