<script lang="ts">
  import * as THREE from "three";
  import { onMount } from "svelte";
  import type { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

  let screenObject: CSS3DObject | null = null;
  let container: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;

  onMount(() => {
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10);
    const yaw = new THREE.Object3D();
    const pitch = new THREE.Object3D();
    yaw.add(pitch);
    pitch.add(camera);
    scene.add(yaw);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 10, 10);
    scene.add(dirLight);

    let cssRenderer: any;
    let laptopScreenMesh: THREE.Object3D | null = null;

    const mouse = new THREE.Vector2();
    const targetYawPitch = new THREE.Vector2();
    const laptopWorldPos = new THREE.Vector3();
    let frameId = 0;

    let cameraDistance = 1.0;
    let cameraState: 1 | 2 | 3 = 1;

    const CAMERA = {
      state1: { distance: 1.0, yawLimit: 0.35, pitchLimit: 0.08, yawStrength: 0.5, pitchStrength: 0.2 },
      state2: { distance: 0.6, yawLimit: 0.15, pitchLimit: 0.0, yawStrength: 0.3, pitchStrength: 0.0 },
      state3: { distance: 0.25, yawLimit: 0, pitchLimit: 0, yawStrength: 0, pitchStrength: 0 },
      lerp: 0.06,
      deadzoneMargin: 50, // pixels around iframe to expand closest state
    };

    // mouse position in pixels
    window.addEventListener("mousemove", (e) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener("click", (e: MouseEvent) => {
      if (!screenObject) return;

      const target = e.target as HTMLElement;

      if (cameraState === 1) {
        cameraState = 2;
        return;
      }

      if (cameraState === 2 && target !== screenObject.element) {
        cameraState = 1;
      }
    });

    (async () => {
      const [{ GLTFLoader }, { CSS3DRenderer, CSS3DObject }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/renderers/CSS3DRenderer.js"),
      ]);

      cssRenderer = new CSS3DRenderer();
      cssRenderer.setSize(window.innerWidth, window.innerHeight);
      cssRenderer.domElement.style.position = "absolute";
      cssRenderer.domElement.style.top = "0";
      cssRenderer.domElement.style.left = "0";
      cssRenderer.domElement.style.pointerEvents = "none";
      cssRenderer.domElement.style.pointerEvents = "auto";
      container.appendChild(cssRenderer.domElement);

      const cssScene = new THREE.Scene();

      const iframe = document.createElement("iframe");
      iframe.src = "/test-website.html";
      iframe.style.width = "1280px";
      iframe.style.height = "800px";
      iframe.style.border = "0";
      iframe.style.pointerEvents = "auto";
      iframe.style.borderRadius = "4px";
      iframe.title = "Laptop Screen";

      // test
      iframe.style.transformStyle = "preserve-3d";
iframe.style.willChange = "transform";

      screenObject = new CSS3DObject(iframe);
      cssScene.add(screenObject);

      iframe.addEventListener("mouseenter", () => {
        cameraState = 3;
      });
      
      const loader = new GLTFLoader();
      loader.load("/models/laptop3.glb", (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        laptopScreenMesh = model.getObjectByName("Laptop_Screen") || null;
        if (!laptopScreenMesh || !screenObject) return;

        const bbox = new THREE.Box3().setFromObject(laptopScreenMesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        screenObject.scale.set(size.x / 1280, size.y / 780, 1);

        laptopScreenMesh.updateWorldMatrix(true, false);
        laptopScreenMesh.getWorldPosition(laptopWorldPos);
        screenObject.position.copy(laptopWorldPos);

        const quat = new THREE.Quaternion();
        laptopScreenMesh.getWorldQuaternion(quat);
        const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);
        screenObject.quaternion.copy(quat).multiply(tilt);
        screenObject.position.add(new THREE.Vector3(0, 0, 1).applyQuaternion(screenObject.quaternion).multiplyScalar(0.0001));

        yaw.position.copy(laptopWorldPos);
      });

      const plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.1;
      scene.add(plane);

      const render = () => {
        if (laptopScreenMesh) {
          laptopScreenMesh.getWorldPosition(laptopWorldPos);
          yaw.position.lerp(laptopWorldPos, 0.1);

          // camera distance per state
          let targetDistance = cameraDistance;
          if (cameraState === 1) targetDistance = CAMERA.state1.distance;
          if (cameraState === 2) targetDistance = CAMERA.state2.distance;
          if (cameraState === 3) targetDistance = CAMERA.state3.distance;
          cameraDistance = THREE.MathUtils.lerp(cameraDistance, targetDistance, 0.05);

          // camera rotation limits
          let yawLimit = 0,
            pitchLimit = 0,
            yawStrength = 0,
            pitchStrength = 0;
          if (cameraState === 1) {
            ({ yawLimit, pitchLimit, yawStrength, pitchStrength } = CAMERA.state1);
          } else if (cameraState === 2) {
            ({ yawLimit, pitchLimit, yawStrength, pitchStrength } = CAMERA.state2);
          } else if (cameraState === 3) {
            ({ yawLimit, pitchLimit, yawStrength, pitchStrength } = CAMERA.state3);
          }

          // --- symmetric expanded deadzone ---
          // --- only handle exit from state 3 ---
          if (cameraState === 3) {
            if (!screenObject) return;
            if (!container) return;
            const iframeRect = screenObject.element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const rect = {
              left: iframeRect.left - containerRect.left,
              right: iframeRect.right - containerRect.left,
              top: iframeRect.top - containerRect.top,
              bottom: iframeRect.bottom - containerRect.top,
            };
            const margin = CAMERA.deadzoneMargin; // how much bigger than iframe

            // Symmetrical expanded box around iframe
            const expandedLeft = rect.left - margin;
            const expandedRight = rect.right + margin;
            const expandedTop = rect.top - margin;
            const expandedBottom = rect.bottom + margin;

            if (mouse.x < expandedLeft || mouse.x > expandedRight || mouse.y < expandedTop || mouse.y > expandedBottom) {
              cameraState = 2; // exit closest state
            }
          }

          // convert mouse to normalized offset for yaw/pitch
          const dx = ((mouse.x / window.innerWidth) * 2 - 1) * yawStrength;
          const dy = (-(mouse.y / window.innerHeight) * 2 + 1) * pitchStrength;
          targetYawPitch.x = THREE.MathUtils.clamp(dx, -yawLimit, yawLimit);
          targetYawPitch.y = THREE.MathUtils.clamp(dy, -pitchLimit, pitchLimit);

          yaw.rotation.y = THREE.MathUtils.lerp(yaw.rotation.y, targetYawPitch.x, CAMERA.lerp);
          pitch.rotation.x = THREE.MathUtils.lerp(pitch.rotation.x, targetYawPitch.y, CAMERA.lerp);

          // center rotation for state 3
          if (cameraState === 3) {
            yaw.rotation.y = THREE.MathUtils.lerp(yaw.rotation.y, 0, 0.1);
            pitch.rotation.x = THREE.MathUtils.lerp(pitch.rotation.x, 0, 0.1);
          }

          camera.position.z = cameraDistance;
          camera.position.y = 0.05;
          camera.lookAt(laptopWorldPos);
        } else {
          camera.position.z = cameraDistance;
          camera.position.y = 0;
          camera.lookAt(new THREE.Vector3(0, 0, 0));
        }

        renderer.render(scene, camera);
        cssRenderer.render(cssScene, camera);
        frameId = requestAnimationFrame(render);
      };
      render();
    })();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      cssRenderer?.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      cssRenderer?.domElement.remove();
    };
  });
</script>

<div bind:this={container} class="relative w-screen h-screen overflow-hidden">
  <canvas bind:this={canvas} class="absolute inset-0 block"></canvas>
</div>
