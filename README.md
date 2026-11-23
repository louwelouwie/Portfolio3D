# Chris Louwerse portfolio

An interactive portfolio prototype. The home page renders a 3D desk with Three.js. The laptop displays `/desktop`, the phone displays `/phone`, and the embedded device displays `/game` in projected iframes. Each route also works without WebGL.

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
| `src/routes/+page.svelte`                       | Home route, scene lifecycle, and device screen overlays.                    |
| `src/lib/components/HeroHeader.svelte`          | Outer scene introduction layout and styles.                                 |
| `src/lib/components/SceneTooltip.svelte`        | Desk object tooltip appearance.                                             |
| `src/lib/components/SceneControls.svelte`       | Light mode, sound, and EN/NL quick controls.                                |
| `src/lib/components/SceneObjectControls.svelte` | Bottom portfolio control and focused back button.                           |
| `src/lib/components/ContactCard.svelte`         | HTML and CSS for the contact card faces.                                    |
| `src/lib/contact.ts`                            | Example contact destinations to replace with your own.                      |
| `src/lib/language.ts`                           | English and Dutch text and saved language choice.                           |
| `src/lib/theme.ts`                              | Saved theme preference and Netherlands daylight calculation.                |
| `src/lib/scene/createPortfolioScene.ts`         | Three.js scene, model loading, camera movement, hover targets, and cleanup. |
| `src/lib/scene/createPopAnimation.ts`           | Staggered entrance scales for the desk, laptop, and props.                  |
| `src/lib/scene/createLampSound.ts`              | Short synthesized lamp switch sound.                                        |
| `src/lib/scene/projectElementToQuad.ts`         | Fits device iframes and card HTML to their projected corners.               |
| `src/lib/scene/deviceScreens.ts`                | Laptop, phone, and embedded screen dimensions.                              |
| `src/routes/desktop/+page.svelte`               | Desktop icon placement, taskbar, and portfolio window state.                |
| `src/routes/phone/+page.svelte`                 | Phone-sized portfolio using the shared portfolio content.                   |
| `src/lib/desktop/windowToIcon.ts`               | Portfolio window opening and closing animation.                             |
| `src/lib/components/DesktopIcon.svelte`         | Desktop icon dragging, hover animation, and click behavior.                 |
| `src/lib/game/runner.ts`                        | Runner physics, obstacles, scoring, and collision logic.                    |
| `src/lib/components/RunnerGame.svelte`          | Reusable runner canvas and press-to-continue controls.                      |
| `src/routes/game/+page.svelte`                  | Runner page shown on the embedded device and available directly.            |
| `src/lib/desktop/iconLayout.ts`                 | Keeps desktop icons apart when loaded or dropped.                           |
| `src/lib/desktop/`                              | Saved icon positions and portfolio window mode.                             |
| `src/lib/components/PortfolioWindow.svelte`     | Portfolio window frame, title bar, and resize controls.                     |
| `src/lib/components/PortfolioContent.svelte`    | Portfolio navigation and page content; start here to redesign the pages.    |
| `src/app.css`                                   | Tailwind import and window resize handle styles.                            |
| `static/models/desk-setup.glb`                  | The assembled desk, laptop, lamp, and props.                                |
| `references/`                                   | Older standalone HTML prototypes, kept outside the public `static` folder.  |

The scene loads `desk-setup.glb` with the objects in their authored positions. It uses the named `Laptop_Screen`, `Phone_Screen`, and `Embedded_Screen` meshes to project one iframe onto each screen. The desk and each top-level prop pop in after loading. Dragging the overview rotates the camera. Clicking the laptop, phone, or embedded device moves to a close view; the phone and embedded views look down at the desk. The top-left control returns to the desk. Hovering the phone, embedded device, lamp, or headphones lifts them; clicking the headphones toggles sound. Clicking the card holder brings the front contact card toward the camera. The laptop desktop and its open window remain mounted across zooms. The scene releases its listeners, render loop, audio context, and model resources when the page unmounts.

The laptop opens `/desktop?closed=1&embedded=1` so visitors see the desktop first. The bottom control opens the phone portfolio below 640px and the laptop portfolio at tablet and desktop widths. Both devices can also be clicked directly. The outer theme follows sunrise and sunset at the KNMI De Bilt location; clicking the lamp or theme button overrides it for the current browser tab session. The laptop and phone portfolio interfaces stay light independently of the outer scene. The top-right sound control remembers its choice. The EN/NL control translates the introduction, tooltips, device pages, window controls, and portfolio copy.

The embedded device shows `/game`, an original dinosaur runner with a press-to-continue start screen, keyboard and touch controls, and a saved best score. The laptop desktop no longer has a Game icon.

## Files not used by the running site

`static/models/desk.glb`, `static/models/desk3.glb`, and `static/models/laptop3.glb` are older models no longer loaded by the site. `static/game.png` was the laptop Game icon and is no longer loaded. `references/test-website.html` and `references/oldwebsite.html` are older prototypes and are not part of the running site. `src/lib/index.ts` contains only a comment; current imports use the `#lib` alias and do not reference it. These files can be reviewed before removing them.

## Next content to add

Replace the starter project description with your actual projects and links. Edit `ContactCard.svelte` for the card markup and profile placeholder, and `src/lib/contact.ts` for the example link destinations. Edit `language.ts` for English and Dutch copy, `PortfolioContent.svelte` for section layout, colors, and typography, and `PortfolioWindow.svelte` for the surrounding window frame. Desktop icons can be dragged within the area above the taskbar. Their positions are saved in browser storage, kept apart, and restored across laptop zooms and reloads. The portfolio window also remembers whether it was maximized. Dragging a maximized window by its title bar restores it to a smaller size, and dragging keeps part of the title bar within the desktop frame. Edit the initial `iconPositions` in `src/routes/desktop/+page.svelte` to change starting locations for visitors without saved positions.

For a step-by-step guide to adding desk props, hover lift, and tooltips, see [Adding scene objects and interactions](docs/scene-interactions.md).
