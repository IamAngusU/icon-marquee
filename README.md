<img src="public/logo.svg" width="72" alt="icon-marquee pixel heart logo" />

# icon-marquee

Scrolling marquees and static rows of tech icons, served as SVG. Drop one into a README, a portfolio or any page with a plain `<img>` tag.

[![icon marquee](https://icon-marquee.giann.dev/v1/marquee?i=js,ts,react,nextjs,svelte,vue,tailwind,bun,nodejs,docker,postgres,redis,go,rust,python)](https://icon-marquee.giann.dev/v1/marquee?i=js,ts,react,nextjs,svelte,vue,tailwind,bun,nodejs,docker,postgres,redis,go,rust,python)

Icons come from [skill-icons](https://github.com/LelouchFR/skill-icons). See [Credits](#credits).

## Quick start

Markdown:

```md
![my stack](https://icon-marquee.giann.dev/v1/marquee?i=js,ts,react,docker)
```

HTML:

```html
<img src="https://icon-marquee.giann.dev/v1/marquee?i=js,ts,react,docker" alt="my stack" />
```

## For AI agents

Agents and LLMs: read [`https://icon-marquee.giann.dev/llms.txt`](https://icon-marquee.giann.dev/llms.txt) before building URLs. It lists every endpoint, parameter, limit, short name and valid icon name in Markdown.

## Endpoints

| Endpoint | Returns |
| --- | --- |
| `GET /v1/marquee?i=…` | Animated SVG that scrolls the icons in a seamless loop |
| `GET /v1/icons?i=…` | Static SVG with the icons in a row |
| `GET /v1` | Health check: `{"status":"ok"}` |

### `/v1/marquee`

![marquee](https://icon-marquee.giann.dev/v1/marquee?i=html,css,js,ts,react,vue,svelte,angular)

```
https://icon-marquee.giann.dev/v1/marquee?i=html,css,js,ts,react,vue,svelte,angular
```

- The icons scroll left at a constant 30px/s, so a longer list makes a longer loop. 8 icons loop every 15 seconds.
- The visible window is at most 400px wide. With fewer icons than fill 400px, the window shrinks to exactly one row and still loops.
- Pass `width` to set the window yourself, up to 3840px. The row repeats to fill it, so even a few icons can span a full-width banner.
- The animation stops for viewers who turn on reduced motion (`prefers-reduced-motion: reduce`).
- It's plain SVG with CSS animation: no JavaScript and no GIF. It stays sharp at any size and works inside `<img>`, including GitHub READMEs.

A wide banner, with three icons repeated to fill 800px:

![wide marquee](https://icon-marquee.giann.dev/v1/marquee?i=go,rust,zig&width=800)

```
https://icon-marquee.giann.dev/v1/marquee?i=go,rust,zig&width=800
```

A short list:

![short marquee](https://icon-marquee.giann.dev/v1/marquee?i=go,rust,zig)

```
https://icon-marquee.giann.dev/v1/marquee?i=go,rust,zig
```

### `/v1/icons`

![icons](https://icon-marquee.giann.dev/v1/icons?i=js,html,css,wasm)

```
https://icon-marquee.giann.dev/v1/icons?i=js,html,css,wasm
```

The same icons in a static row, in the order you list them.

## Query parameters

| Param | Required | Description |
| --- | --- | --- |
| `i` | yes | Comma-separated icon names or short names, e.g. `i=js,ts,react` |
| `width` | no | `/v1/marquee` only. Window width in px, a whole number from 1 to 3840, e.g. `width=1200` |

Behaviour of the `i` list:

- **Order** is kept: icons render left to right as listed.
- **Case and spaces** are ignored: `i=JS, TS` works.
- **Duplicates** are allowed: `i=js,js,js` renders three.
- **Limit:** at most 100 icons per request.
- **Names:** use any icon name from the [full list](#available-icons) or a [short name](#short-names).

## Theme

Icons that have light and dark versions switch automatically with the viewer's system light/dark setting. Icons with one design always render the same. The [full list](#available-icons) marks themed icons with *.

![themed](https://icon-marquee.giann.dev/v1/icons?i=github,nextjs,vercel,bun,rust)

## Short names

| Short name | Icon |
| --- | --- |
| `ae` | `aftereffects` |
| `ai` | `illustrator` |
| `amazonwebservices` | `aws` |
| `an` | `animate` |
| `ar` | `aero` |
| `arc` | `arcbrowser` |
| `asm` | `assembly` |
| `au` | `audition` |
| `be` | `behance` |
| `bots` | `discordbots` |
| `br` | `bridge` |
| `ca` | `capture` |
| `cc` | `creativecloud` |
| `cf` | `cloudflare` |
| `ch` | `characteranimator` |
| `dn` | `dimension` |
| `dw` | `dreamweaver` |
| `express` | `expressjs` |
| `fr` | `fresco` |
| `fs` | `fuse` |
| `gatsbyjs` | `gatsby` |
| `ghactions` | `githubactions` |
| `go` | `golang` |
| `googlecloud` | `gcp` |
| `gql` | `graphql` |
| `hc` | `holyc` |
| `hf` | `huggingface` |
| `ic` | `incopy` |
| `id` | `indesign` |
| `jq` | `jqlang` |
| `js` | `javascript` |
| `k8s` | `kubernetes` |
| `ktorio` | `ktor` |
| `lr` | `lightroom` |
| `lrc` | `lightroomclassic` |
| `md` | `markdown` |
| `me` | `mediaencoder` |
| `million` | `millionjs` |
| `mongo` | `mongodb` |
| `mui` | `materialui` |
| `nest` | `nestjs` |
| `net` | `dotnet` |
| `next` | `nextjs` |
| `nix` | `nixos` |
| `notepad++` | `notepadpp` |
| `nuxt` | `nuxtjs` |
| `pf` | `portfolio` |
| `pl` | `prelude` |
| `pop` | `popos` |
| `postgres` | `postgresql` |
| `pr` | `premiere` |
| `ps` | `photoshop` |
| `psc` | `photoshopclassic` |
| `psx` | `photoshopexpress` |
| `pwsh` | `powershell` |
| `py` | `python` |
| `rollup` | `rollupjs` |
| `ru` | `premiererush` |
| `rxjava` | `reactivex` |
| `rxjs` | `reactivex` |
| `sc` | `scala` |
| `scss` | `sass` |
| `sklearn` | `scikitlearn` |
| `sp` | `adobespark` |
| `sqla` | `sqlalchemy` |
| `st` | `stock` |
| `tailwind` | `tailwindcss` |
| `ts` | `typescript` |
| `twitter` | `x` |
| `unreal` | `unrealengine` |
| `vb` | `visualbasic` |
| `vlang` | `v` |
| `vue` | `vuejs` |
| `wasm` | `webassembly` |
| `windi` | `windicss` |
| `yml` | `yaml` |

Full icon names also work, e.g. `i=javascript` is the same as `i=js`.

## Available icons

834 icons, 624 of them themed.

<details>
<summary>Show all icon names</summary>

`aave`*, `ableton`*, `acrobat`, `activitypub`*, `actix`*, `adobespark`, `adonis`, `aero`, `affinity`, `aftereffects`, `agno`, `aiogram`*, `airbyte`*, `airflow`*, `aiscript`*, `alacritty`*, `alchemy`*, `alpinejs`*, `amplify`, `anaconda`*, `android`*, `androidstudio`*, `angular`*, `animate`, `animejs`*, `anki`*, `ansible`, `ansys`*, `antdesign`*, `apache`*, `apeworx`*, `apexcharts`*, `api`*, `apidog`*, `apigateway`, `apollo`, `appactive`*, `appcode`*, `apple`*, `appstore`, `apptainer`*, `appwrite`*, `aqua`*, `arcbrowser`*, `arch`*, `arcjet`*, `arduino`, `argocd`*, `arrow`*, `aseprite`*, `assembly`, `astro`, `athena`, `atom`, `audacity`*, `audition`, `aurora`, `authenticator`*, `authjs`*, `autocad`*, `avaloniaui`, `aws`*, `axios`*, `azul`, `azure`*, `azuredevops`*, `babel`, `balancer`*, `barbajs`, `bash`*, `beam`*, `beeceptor`*, `behance`, `behat`*, `betterauth`*, `bevy`*, `bigquery`*, `biome`*, `bitbucket`*, `bitrix24`*, `blazor`*, `blender`*, `bluesky`*, `bokeh`*, `bootstrap`, `brave`*, `breeze`, `bridge`, `bsd`*, `btlo`*, `bulma`*, `bun`*, `burn`*, `burpsuite`*, `c`, `cachyos`*, `caddy`*, `cairo`*, `canva`*, `capacitor`*, `capture`, `cashier`, `cassandra`*, `catppuccin`*, `celerdata`*, `celery`*, `centos`*, `chainlink`*, `chakraui`*, `chaosblade`*, `characteranimator`, `chartjs`*, `chatgpt`*, `chi`*, `chrome`*, `chromedevtools`, `chromium`*, `circleci`*, `claude`*, `clerk`, `clickhouse`*, `clickup`*, `clion`*, `clojure`*, `cloudflare`*, `cloudformation`, `cloudfront`*, `cloudwatch`, `cmake`*, `cockroachdb`*, `codeberg`*, `codeblocks`*, `codeigniter`*, `codepen`*, `coffeescript`*, `commercetools`*, `composer`*, `confluence`*, `confluent`*, `consul`*, `contentful`*, `cpp`, `creativecloud`, `crewai`*, `crystal`*, `cs`, `css`, `cuda`*, `cursor`*, `cypress`*, `d`, `d3`*, `daft`*, `dailydev`*, `daisyui`*, `dapper`*, `dart`*, `dask`*, `databricks`*, `datadog`, `datagrip`*, `dataspell`*, `davinci`, `dbeaver`*, `dbtlabs`*, `debian`, `deepseek`*, `defold`*, `delta`*, `deltars`*, `deno`*, `desmos`, `devto`*, `digitalocean`*, `dimension`, `directus`, `discord`, `discordbots`, `discordjs`*, `django`, `djangorestframework`*, `dn42`*, `docker`, `docksal`*, `docsify`*, `doctrine`*, `doris`*, `dotnet`, `dreamweaver`, `dremio`, `drizzle`*, `drupal`*, `dubbo`*, `duckdb`, `duckduckgo`, `dusk`, `dynamodb`*, `ec2`, `echo`, `eclipse`*, `ecr`, `ecs`, `edge`*, `ejs`*, `eks`, `elasticbeanstalk`, `elasticsearch`*, `elb`, `electron`, `element`*, `elementor`*, `elementplus`*, `elixir`*, `elm`*, `elysia`*, `emacs`, `ember`, `emotion`*, `emr`, `envoyer`, `erlang`*, `eslint`*, `etcd`*, `ethereum`*, `eventbridge`, `excel`*, `expo`*, `expressjs`*, `fabric`*, `fabricmc`*, `facebook`, `fargate`, `fastai`*, `fastapi`, `fastlane`*, `fediverse`*, `fedora`*, `ffmpeg`*, `fiber`*, `figma`*, `filament`, `filmora`*, `firebase`*, `firefox`*, `fiverr`, `fivetran`*, `flameshot`, `flask`, `fleet`*, `flink`, `flutter`*, `flutterflow`*, `flyio`, `fonts`, `forge`, `forgejo`*, `forgemc`*, `forth`, `fortran`, `foundry`*, `framer`*, `frankenphp`*, `freecad`*, `freecodecamp`*, `freelancer`*, `fresco`, `fresh`*, `fuse`, `gamemakerstudio`, `ganache`*, `gatsby`, `gcp`*, `gdevelop`*, `gemini`*, `gentoo`*, `gherkin`*, `ghostty`*, `gimp`*, `gin`*, `git`*, `gitbash`*, `gitea`*, `github`*, `githubactions`*, `githubcopilot`*, `githubdesktop`*, `githubpages`*, `gitkraken`*, `gitlab`*, `gleam`*, `glue`, `gmail`*, `gmx`*, `gnome`*, `godot`*, `goland`*, `golang`, `googleanalytics`*, `googleappsscript`*, `googlecolab`*, `googleplay`*, `googleplayconsole`*, `gorm`*, `gradio`*, `gradle`*, `grafana`*, `grails`, `granica`, `graphite`*, `graphql`*, `grok`*, `gromacs`*, `groq`*, `grpc`*, `grunt`*, `gsap`*, `gtk`*, `gulp`, `hackerrank`*, `hackthebox`*, `hadoop`*, `hardhat`*, `haskell`*, `haxe`*, `haxeflixel`*, `helia`*, `helix`*, `helm`*, `herd`, `heroku`, `hexo`*, `hibernate`*, `higress`*, `hive`, `holyc`, `hono`*, `horizon`, `html`, `htmx`*, `htop`*, `hudi`*, `huggingface`*, `hugo`*, `hydrogen`*, `hyprland`*, `i3`*, `iceberg`*, `iced`, `idea`*, `ignite`*, `illustrator`, `immuta`*, `impala`*, `incopy`, `indesign`, `inertia`, `informatica`*, `infura`, `inkscape`*, `insomnia`, `instagram`, `integrations`*, `ipfs`*, `itchio`*, `jaeger`*, `jamovi`, `java`*, `javascript`, `jax`*, `jekyll`*, `jenkins`*, `jest`, `jetpackcompose`*, `jetstream`, `jira`*, `joomla`*, `jqlang`*, `jquery`, `json`*, `julia`*, `junit`*, `jupyter`*, `jwt`*, `k3s`*, `kafka`, `kaggle`*, `kakoune`*, `kali`*, `karma`*, `kde`*, `kdenlive`*, `keycloak`, `keydb`*, `kibana`*, `kitty`*, `kong`*, `kotlin`*, `ktor`*, `kubernetes`, `kubevela`*, `lambda`, `lancedb`*, `lando`*, `langchain`*, `laravel`*, `laravelspark`*, `latex`*, `lazyvim`*, `leaflet`*, `leetcode`*, `less`*, `libreoffice`*, `librewolf`*, `libsql`, `lighthouse`, `lightning`*, `lightroom`, `lightroomclassic`, `linkedin`, `linux`*, `liquidsoap`*, `lit`*, `litestar`*, `litmus`*, `livewire`*, `llamaindex`*, `logto`*, `looker`*, `lottielab`, `lua`*, `luau`, `lucidchart`*, `lunacy`, `lxc`*, `lynxjs`*, `macos`*, `manim`*, `manjaro`, `mariadb`*, `markdown`*, `mastodon`*, `materialui`*, `matlab`*, `matplotlib`*, `maven`*, `max8`, `max9`, `mcp`*, `mdbook`*, `mediaencoder`, `medium`*, `mermaid`, `metabase`*, `meteorjs`*, `microsoftcopilot`*, `miktex`*, `millionjs`*, `milvus`*, `mindsdb`*, `mint`*, `miro`, `misskey`*, `mistral`*, `mjml`*, `ml5`*, `mlflow`*, `mobx`, `mocha`*, `modelviewer`*, `mojo`*, `mongodb`, `mongoose`, `mux`*, `mysql`*, `n8n`*, `nacos`*, `neo4j`*, `neoforge`*, `neon`*, `neovim`*, `nestjs`*, `netlify`*, `nextflow`*, `nextjs`*, `nginx`, `ngrok`, `ngrx`*, `nim`*, `nixos`*, `nodejs`*, `notepadpp`*, `notion`*, `nova`, `npm`*, `numpy`*, `nunjucks`, `nuxtjs`*, `nvidia`*, `obs`*, `obsidian`*, `ocaml`, `octane`, `octave`*, `odin`*, `ollama`*, `onedrive`*, `onehouse`*, `onenote`*, `opencv`*, `openmm`*, `opensergo`*, `openshift`, `opensource`*, `openstack`*, `opentelemetry`*, `openzeppelin`*, `opera`*, `oracle`*, `orchid`, `outlook`*, `overleaf`*, `p4`*, `p5js`, `pail`*, `pancakeswap`*, `pandas`*, `papertrail`, `payload`*, `pbi`*, `pennant`, `perl`, `phaser`*, `photoshop`, `photoshopclassic`, `photoshopexpress`, `php`*, `phpstan`*, `phpstorm`*, `picocss`*, `pinecone`*, `pinescript`*, `pinia`*, `pint`, `pkl`*, `plan9`*, `planetscale`*, `platformio`*, `playcanvas`, `playfab`*, `playwright`*, `plotly`*, `plsql`*, `pm2`*, `pnpm`*, `pocketbase`*, `podman`*, `polar`*, `polars`, `popos`, `portainer`*, `portfolio`, `postcss`*, `postgresql`*, `postman`, `powerautomate`*, `powerpoint`*, `powershell`*, `powertoys`, `preact`*, `prelude`, `premiere`, `premiererush`, `presto`*, `prettier`*, `primeng`*, `primereact`*, `primevue`*, `prisma`, `processing`*, `prometheus`, `prompts`, `proton`*, `proxmox`*, `pug`*, `pulsar`*, `pulse`*, `pulumi`*, `puppeteer`*, `puppygraph`*, `putty`*, `pwa`*, `pycharm`*, `pydantic`*, `pygame`*, `pypi`, `pyspark`*, `pytest`*, `python`*, `pytorch`*, `pyxel`*, `qdrant`*, `qemu`*, `qodana`*, `qt`*, `quarkus`*, `qubesos`*, `querydsl`*, `quiltmc`*, `r`*, `rabbitmq`*, `radix`*, `rails`, `railway`*, `rancher`*, `raspberrypi`*, `ratatui`*, `ray`*, `rclone`*, `rds`, `react`*, `reactbootstrap`*, `reactivex`*, `reactlynx`*, `reactnative`*, `reactos`*, `reactquery`*, `reactrouter`*, `recoil`, `reddit`, `redhat`*, `redis`*, `redshift`*, `redux`, `regex`*, `remix`*, `render`*, `renpy`*, `replit`*, `resend`*, `resharper`*, `restructuredtext`*, `reverb`, `revolt`*, `rider`*, `robloxstudio`, `rocket`, `rocketmq`*, `rollupjs`*, `ros`*, `rubocop`*, `ruby`, `rubymine`*, `rust`*, `rustrover`*, `s3`*, `safari`*, `sail`, `salesforce`*, `sanctum`, `sanity`*, `sas`*, `sass`, `scala`*, `scikitlearn`*, `scipy`*, `scout`, `scratch`, `seaborn`*, `seata`*, `selenium`, `sentinel`*, `sentry`, `sequelize`*, `ses`, `session`*, `shadcn`*, `sharepoint`*, `shopify`*, `signal`, `skeletonui`*, `sketchup`*, `skywalking`*, `slack`*, `snowflake`*, `snyk`*, `socialite`, `socketio`*, `solana`*, `solidity`, `solidjs`*, `sonarqube`*, `spark`*, `sparksql`*, `sphinx`*, `spring`*, `springbatch`*, `springdatajpa`*, `springsecurity`*, `sqlalchemy`*, `sqlite`, `sqlserver`*, `sqs`, `stackoverflow`*, `stan`*, `starburst`*, `starrocks`*, `steam`, `stock`, `storyblok`*, `storybook`*, `strapi`, `streamlit`*, `stripe`*, `styledcomponents`, `stylelint`*, `stylus`*, `sublime`*, `supabase`*, `surrealdb`*, `sushiswap`*, `svelte`, `svg`*, `svn`, `swagger`*, `swift`, `symfony`*, `systemd`*, `t3`*, `tableau`*, `taiga`*, `tailscale`*, `tailsos`, `tailwindcss`*, `tallyprime`, `tanstack`*, `tauri`*, `teams`*, `tecton`*, `telegram`, `telescope`, `tensorflow`*, `terminal`*, `terraform`*, `testinglibrary`*, `texmaker`*, `threejs`*, `thunderbird`*, `thunkable`, `tidb`*, `tmux`*, `tokiors`*, `tomcat`*, `toml`*, `tor`*, `touchdesigner`*, `trino`*, `trpc`, `truffle`*, `tryhackme`*, `turborepo`*, `turso`*, `twig`*, `twitch`, `typeorm`*, `typescript`, `typst`*, `ubuntu`, `uml`*, `uniswap`*, `unity`*, `unitycatalog`*, `unocss`*, `unrealengine`, `unstructured`, `upwork`*, `v`*, `vagrant`*, `vala`, `vapor`, `vegaspro`, `vercel`*, `vim`*, `virtualbox`*, `visio`*, `visualbasic`*, `visualstudio`*, `vite`*, `vitepress`*, `vitest`*, `vmwareworkstation`*, `vscode`*, `vscodeinsiders`*, `vscodium`*, `vuejs`*, `vuetify`*, `vyper`*, `wails`*, `wandb`*, `warp`*, `webassembly`, `webflow`, `webpack`*, `websocket`*, `webstorm`*, `webstudio`*, `wezterm`*, `windicss`*, `windmill`*, `windows`*, `winedt`*, `wireshark`*, `word`*, `wordpress`, `workers`*, `wsl`*, `wxt`*, `x`*, `xcode`*, `xd`, `xtable`*, `yaml`*, `yammer`*, `yarn`*, `yew`*, `yii`*, `youtube`, `yui`*, `zabbix`, `zed`*, `zellij`*, `zen`*, `zig`*, `zudoku`*, `zustand`*

\* follows the viewer's light/dark setting.

</details>

## Self-hosting

Requires [Bun](https://bun.sh).

```sh
bun install
cp .env.example .env   # then set APP_NAME
bun dev                # http://localhost:3000/v1/marquee?i=js,ts
```

### Environment

| Variable | Required | Description |
| --- | --- | --- |
| `APP_NAME` | yes | App name. The server refuses to start without it. |

### Scripts

| Script | Does |
| --- | --- |
| `bun dev` | Run with hot reload |
| `bun start` | Run |
| `bun test` | Run tests |
| `bun run typecheck` | Type-check with `tsc` |
| `bun run check` | Lint, format and sort imports with Biome |

## Credits

Icons are from [skill-icons](https://github.com/LelouchFR/skill-icons) by Baptiste Zahnow, MIT licensed. See [ATTRIBUTION.md](ATTRIBUTION.md).

## License

[MIT](LICENSE)
