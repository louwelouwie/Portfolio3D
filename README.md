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

| Path                                        | Responsibility                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/routes/+page.svelte`                   | Home page, page metadata, zoom buttons, and direct portfolio link.            |
| `src/lib/scene/createPortfolioScene.ts`     | Three.js scene, model loading, camera movement, resize handling, and cleanup. |
| `src/routes/desktop/+page.svelte`           | Desktop icons, taskbar, and portfolio window state.                           |
| `src/lib/components/PortfolioWindow.svelte` | Portfolio content and draggable, resizable window.                            |
| `src/app.css`                               | Tailwind import and window resize handle styles.                              |
| `static/models/`                            | Laptop and desk GLB files.                                                    |

The scene waits for both models before positioning the desk. It finds the laptop screen by the `Laptop_Screen` object name in `laptop3.glb`, then places a CSS3D iframe over that mesh. Dragging the overview rotates the camera. Hovering over the laptop raises it slightly and shows a tooltip; clicking it moves to the focused view and enables interaction with the iframe. Use **Back to scene** or Escape to leave the focused view. The scene releases its listeners, render loop, and model resources when the page unmounts.

The older `static/test-website.html` and `static/oldwebsite.html` files are retained as references. The laptop screen opens `/desktop?closed=1` so visitors see the desktop first; the direct portfolio link opens `/desktop` with the portfolio window visible.

## Next content to add

Replace the starter project description with your actual projects and links. Add your preferred contact details when ready. If the site will be deployed under a subpath, SvelteKit's `asset()` and `resolve()` calls already handle the app's routes and static files.
