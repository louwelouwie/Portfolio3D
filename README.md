# Chris Louwerse portfolio

An interactive portfolio prototype. The home page renders a 3D laptop with Three.js; its screen displays the `/desktop` SvelteKit route in an iframe. The desktop route also works on its own, so visitors can open the portfolio without WebGL.

## Run the project

Use Node.js 22.17 or newer. Install dependencies with `npm install`, then run:

| Command                | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the development server.            |
| `npm run check`        | Check Svelte and TypeScript code.        |
| `npm run lint`         | Check code with ESLint.                  |
| `npm run format`       | Format source files with Prettier.       |
| `npm run format:check` | Check formatting without changing files. |
| `npm run build`        | Create a production build.               |
| `npm run preview`      | Preview the production build locally.    |

On Windows PowerShell installations that block `npm.ps1`, use `npm.cmd` in place of `npm`.

VS Code will suggest the extensions listed in `.vscode/extensions.json` when this folder is opened.

## Where things live

| Path                                            | Responsibility                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| `src/routes/+page.svelte`                       | Home route, scene lifecycle, and laptop screen overlay.                     |
| `src/lib/components/HeroHeader.svelte`          | Outer scene introduction layout and styles.                                 |
| `src/lib/components/SceneTooltip.svelte`        | Lamp and laptop tooltip appearance.                                         |
| `src/lib/components/SceneControls.svelte`       | Light mode, sound, and EN/NL quick controls.                                |
| `src/lib/components/SceneObjectControls.svelte` | Separate bottom buttons for opening scene objects.                          |
| `src/lib/language.ts`                           | English and Dutch text and saved language choice.                           |
| `src/lib/scene/createPortfolioScene.ts`         | Three.js scene, model loading, camera movement, hover targets, and cleanup. |
| `src/lib/scene/createPopAnimation.ts`           | Staggered entrance scales for the desk, laptop, and props.                  |
| `src/lib/scene/createLampSound.ts`              | Short synthesized lamp switch sound.                                        |
| `src/lib/scene/projectIframeToQuad.ts`          | Projects the clickable iframe onto the four laptop screen corners.          |
| `src/lib/scene/deviceScreens.ts`                | Shared screen dimensions used by the model preview and clickable overlay.   |
| `src/routes/desktop/+page.svelte`               | Desktop icon placement, taskbar, and portfolio window state.                |
| `src/lib/desktop/windowToIcon.ts`               | Portfolio window opening and closing animation.                             |
| `src/lib/components/DesktopIcon.svelte`         | Desktop icon dragging, hover animation, and click behavior.                 |
| `src/lib/game/runner.ts`                        | Runner physics, obstacles, scoring, and collision logic.                    |
| `src/lib/components/RunnerGame.svelte`          | Reusable runner canvas and press-to-continue controls.                      |
| `src/routes/game/+page.svelte`                  | Standalone game page opened by the desktop Game icon.                       |
| `src/lib/desktop/iconLayout.ts`                 | Keeps desktop icons apart when loaded or dropped.                           |
| `src/lib/desktop/`                              | Saved icon positions and portfolio window mode.                             |
| `src/lib/components/PortfolioWindow.svelte`     | Portfolio window frame, title bar, and resize controls.                     |
| `src/lib/components/PortfolioContent.svelte`    | Portfolio navigation and page content; start here to redesign the pages.    |
| `src/app.css`                                   | Tailwind import and window resize handle styles.                            |
| `static/models/desk-setup.glb`                  | The assembled desk, laptop, lamp, and props.                                |
| `references/`                                   | Older standalone HTML prototypes, kept outside the public `static` folder.  |

The scene loads `desk-setup.glb` with the objects in their authored positions. It finds the laptop screen by the `Laptop_Screen` object name, then measures that mesh's four corners and tilt to place the CSS3D iframe. The desk and each top-level prop pop in after loading. Dragging the overview rotates the camera. Hovering over the laptop raises it slightly and shows a tooltip. Clicking it moves to a close view, where a clickable iframe is projected onto the screen's four corners. The Portfolio icon opens a window from its icon; maximize and restore also animate. The bottom laptop button or Escape leaves the close view. The scene releases its listeners, render loop, audio context, and model resources when the page unmounts.

The laptop opens `/desktop?closed=1&embedded=1` so visitors see the desktop first. New visitors start in light mode; later outer light/dark choices are remembered. The laptop interface stays light independently of the lamp and the quick light mode control, which change the outer scene only. The top-right sound control mutes or enables the lamp switch sound and remembers the choice. The bottom-center laptop button is separate so more object buttons can be added beside it. The EN/NL control translates the introduction, tooltips, desktop labels, window controls, and portfolio copy. The `/desktop` route also works on its own as a portfolio page without WebGL.

The desktop Game icon opens `/game`, an original dinosaur runner with a press-to-continue start screen, keyboard and touch controls, and a saved best score. The route can later be shown on the embedded device when its camera view is chosen.

## Files not used by the running site

`static/models/desk.glb`, `static/models/desk3.glb`, and `static/models/laptop3.glb` are older models no longer loaded by the site. `references/test-website.html` and `references/oldwebsite.html` are older prototypes and are not part of the running site. `src/lib/index.ts` contains only a comment; current imports use the `#lib` alias and do not reference it. These files can be reviewed before removing them.

## Next content to add

Replace the starter project description with your actual projects and links. Add your preferred contact details when ready. Edit `language.ts` for English and Dutch copy, `PortfolioContent.svelte` for section layout, colors, and typography, and `PortfolioWindow.svelte` for the surrounding window frame. Desktop icons can be dragged within the area above the taskbar. Their positions are saved in browser storage, kept apart, and restored across laptop zooms and reloads. The portfolio window also remembers whether it was maximized. Dragging a maximized window by its title bar restores it to a smaller size, and dragging keeps part of the title bar within the desktop frame. Edit the initial `iconPositions` in `src/routes/desktop/+page.svelte` to change starting locations for visitors without saved positions.

For a step-by-step guide to adding desk props, hover lift, and tooltips, see [Adding scene objects and interactions](docs/scene-interactions.md).
