# Adding desk objects and interactions

The visible setup comes from `static/models/desk-setup.glb`. The Three.js setup is in `src/lib/scene/createPortfolioScene.ts`. Tooltip copy is in `src/lib/language.ts`, and its appearance is in `src/lib/components/SceneTooltip.svelte`.

## Choose how to build a prop

The current export keeps the desk, laptop, and props in one scene. The laptop screen alignment depends on its named `Laptop_Screen` mesh. For new props, choose based on how you want to edit them:

- Add a prop to `desk-setup.glb` when it belongs to the permanent composition and you prefer arranging it in Blender. Give it a distinct top-level object or parent so its loose parts animate together.
- Use a separate GLB when you want to edit or replace a prop independently. Load it with `GLTFLoader`, add it under the loaded scene, and dispose its resources when the scene unmounts.
- Build it from Three.js geometry in code when it has a simple shape, such as a coaster or stack of boxes. Add the resulting group under the loaded scene.

Separate named roots are useful for hover, click, lift, and shadows regardless of which option you choose.

## Add an object

1. In Blender, add a top-level object or parent named `Notebook`, place it on the desk, and export `desk-setup.glb` again. Keep the names `Desk`, `Laptop_Base`, `Laptop_Screen`, `Lamp_Base`, and `Lamp_Bulb` for the existing scene behavior.
2. Find the object after the model loads, next to `desk.getObjectByName('Lamp_Base')`:

   ```ts
   const notebook = desk.getObjectByName('Notebook');
   ```

3. Top-level objects already receive a staggered pop animation, and their meshes cast shadows. Child meshes pop with their parent. To change the timing, edit the `props` loop in `createPortfolioScene.ts`.

For a code-created mesh, make sure you dispose of its geometry and material with the scene. Meshes attached to `desk` are covered by `disposeModel(desk)`.

## Add hover and click behavior

The existing lamp is the simplest example to follow:

1. Add `'notebook'` to the `HoverTarget` union near the top of `createPortfolioScene.ts`.
2. Store the `Notebook` object beside the existing `lamp` variable. In `hitTarget`, test whether the nearest raycast hit is inside that object using `isWithin(hit.object, notebook)`. Do this before the laptop test. The existing screen-plane fallback is specifically for the laptop screen.
3. In `onPointerUp`, add a branch for `target === 'notebook'` and perform the click action. The `!dragged` guard keeps camera drags from triggering clicks.
4. In `src/lib/language.ts`, add English and Dutch tooltip text. In `src/lib/components/SceneTooltip.svelte`, select that text for `lastTarget === 'notebook'`. `onHoverChange` already controls its fade in and out.
5. Give the tooltip an anchor above the object. Use `new THREE.Box3().setFromObject(notebook)` to find its top, then update the `tooltipPosition` branch in the render loop. If the object moves, recalculate its world position before projecting it with `tooltipPosition.project(camera)`.

## Add a hover lift

Save the object's starting position after loading: `const startY = notebook.position.y`. In the render loop, ease toward a small offset:

```ts
notebookLift = THREE.MathUtils.lerp(notebookLift, hovered === 'notebook' ? 0.01 : 0, 0.08);
notebook.position.y = startY + notebookLift;
```

Declare `notebookLift` outside the render loop, as the laptop's `lift` is. If the tooltip is attached to the object's top, include the lift in its anchor. The amount `0.01` is in scene units; adjust it by eye for the object's size. Try the hover and click in both light and dark mode and at the laptop's focused camera angle, because nearby meshes can intercept the raycast.
