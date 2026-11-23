# Development guide

## Run locally

Use Node.js 24.x to match the Vercel build environment. From the repository root, run:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. On Windows PowerShell, use `npm.cmd` if the shell blocks `npm.ps1`.

| Command                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `npm run check`        | Run Svelte and TypeScript checks.     |
| `npm run lint`         | Run ESLint.                           |
| `npm run format:check` | Check formatting.                     |
| `npm run format`       | Apply Prettier formatting.            |
| `npm run build`        | Build the production site.            |
| `npm run preview`      | Preview the production build locally. |

VS Code suggests the extensions listed in [`.vscode/extensions.json`](../.vscode/extensions.json).

## Edit the portfolio

| What to edit                                     | Where                                                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Skills, About, Contact, and Projects pages       | [`src/lib/components/portfolio/`](../src/lib/components/portfolio/)                                                              |
| Contact destinations shared by the apps and card | [`src/lib/contact.ts`](../src/lib/contact.ts)                                                                                    |
| The contact card layout                          | [`ContactCard.svelte`](../src/lib/components/ContactCard.svelte)                                                                 |
| English and Dutch copy                           | [`src/lib/language.ts`](../src/lib/language.ts)                                                                                  |
| Laptop icons, taskbar, and window behavior       | [Desktop route](../src/routes/desktop/+page.svelte) and [`PortfolioWindow.svelte`](../src/lib/components/PortfolioWindow.svelte) |
| Phone launcher and app history                   | [Phone route](../src/routes/phone/+page.svelte)                                                                                  |
| CV preview and download                          | The PDF and its first-page print image are in [`src/lib/assets/`](../src/lib/assets/).                                           |

The laptop and phone use the same app pages. The laptop stores icon positions and its window mode in the browser. To change the default desktop positions for new visitors, edit `iconAnchors` in the desktop route.

When updating the CV, replace `ChrisLouwerseCV.pdf` and export its first page as `ChrisLouwerseCV-print.png` at around 1600 pixels wide. The PNG is the texture on the printer paper, and the download serves the PDF.

## Edit the scene

The home route starts the [Three.js scene](../src/lib/scene/createPortfolioScene.ts) and projects the device screens onto the named meshes in [`desk-setup.glb`](../static/models/desk-setup.glb). See [Adding desk objects and interactions](scene-interactions.md) for the export and hover workflow.

The desk lighting follows sunrise and sunset in the Netherlands until the visitor changes it for that tab session. The laptop and phone interfaces use their own light theme. The embedded display is served at `/game`. The runner code is in [`RunnerGame.svelte`](../src/lib/components/RunnerGame.svelte) and [`src/lib/game/runner.ts`](../src/lib/game/runner.ts).

Older desk models and the original game icon are still in `static/`. The earlier HTML prototypes are in `references/`.

## Deploy to Vercel

Use the **SvelteKit** preset, Node.js **24.x**, and the repository root. The build script runs `vite build`, and [`vite.config.ts`](../vite.config.ts) uses SvelteKit's automatic adapter. Use the preset's default install and output settings.

The production branch is `main`. Once the Git connection is set up, pushing to `main` triggers a production build. See [Vercel's SvelteKit guide](https://vercel.com/docs/frameworks/full-stack/sveltekit).
