"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getAllRealisations, type Realisation } from "@/lib/realisations";

/* ──────────────────────────────────────────────────────────────────────────
   Le système solaire de la page d'accueil, en WebGL.

   POURQUOI PAS EN CSS — trois tentatives en dégradés l'ont montré : un
   `radial-gradient` circulaire reste une pastille. Une sphère qui tourne,
   éclairée par une source ponctuelle, avec une texture et un halo additif,
   n'existe pas en CSS. Les deux références (Solar System Scope, Eyes on the
   Solar System) sont des applications WebGL ; il fallait le même outil.

   PAS DE POST-TRAITEMENT — un `UnrealBloomPass` imposerait un EffectComposer,
   deux cibles de rendu supplémentaires et une passe plein écran par frame.
   Le halo du soleil est obtenu par trois sprites en fusion additive, ce qui
   coûte trois quads et rend le même service.

   BUDGET — le rendu s'arrête dès que l'onglet passe en arrière-plan ou que la
   page a défilé au-delà de la scène. Le ratio de pixels est plafonné, la
   géométrie et le nombre d'étoiles baissent sur petit écran, et en mouvement
   réduit une seule frame est produite puis la boucle s'arrête : l'image reste,
   le GPU se taît.
   ──────────────────────────────────────────────────────────────────────── */

const LIVE = getAllRealisations().filter((r) => r.status === "live");

/** Rayon d'orbite, inclinaison (rad), rayon de la planète, période (s). */
const ORBITS = [
  { radius: 5.2,  incl: 0.16, tiltZ: -0.22, size: 0.42, period: 34,  ring: false },
  { radius: 7.4,  incl: 0.05, tiltZ:  0.14, size: 0.52, period: 52,  ring: false },
  { radius: 9.8,  incl: 0.22, tiltZ: -0.09, size: 0.38, period: 74,  ring: false },
  { radius: 12.4, incl: 0.10, tiltZ:  0.26, size: 0.62, period: 98,  ring: true },
  { radius: 15.2, incl: 0.27, tiltZ: -0.05, size: 0.46, period: 126, ring: false },
  { radius: 18.4, incl: 0.13, tiltZ:  0.19, size: 0.55, period: 158, ring: false },
];

/** Halo radial réutilisé pour la couronne et les étoiles. */
function glowTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── Bruit ────────────────────────────────────────────────────────────────
   Les premières textures empilaient des disques tirés au hasard : de loin,
   du bruit blanc. Une surface d'astre a une structure — des motifs larges
   qui en contiennent de plus fins, eux-mêmes en contenant d'autres. C'est
   exactement ce que produit un bruit fractal : on additionne plusieurs
   octaves d'un même bruit, chacune deux fois plus fine et deux fois moins
   forte que la précédente.

   La grille est périodique en X, sans quoi une couture verticale apparaît
   là où la texture se referme autour de la sphère. */
function makeNoise(seed: number) {
  const N = 64;
  const grid = new Float32Array(N * N);
  let s = seed;
  for (let i = 0; i < N * N; i++) {
    grid[i] = (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  }
  const smooth = (t: number) => t * t * (3 - 2 * t);

  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const x0 = ((xi % N) + N) % N;
    const x1 = (x0 + 1) % N;
    const y0 = Math.min(N - 1, Math.max(0, yi));
    const y1 = Math.min(N - 1, y0 + 1);
    const a = grid[y0 * N + x0], b = grid[y0 * N + x1];
    const c = grid[y1 * N + x0], d = grid[y1 * N + x1];
    return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
  };
}

function fbm(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
) {
  let sum = 0, amp = 0.5, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x * f, y * f) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/**
 * Texture de planète, dérivée de la couleur du projet.
 *
 * Le bruit est écrasé en X : une turbulence étirée en longitude donne les
 * bandes d'une géante gazeuse. Et il est déformé par un second bruit avant
 * d'être lu — c'est ce « domain warping » qui tord les bandes en volutes au
 * lieu de les laisser rectilignes, la différence entre un store vénitien et
 * une atmosphère.
 *
 * Les latitudes hautes s'éclaircissent et se lissent : des calottes, qui
 * donnent en prime un repère pour lire la rotation.
 */
function planetTexture(hex: string) {
  const W = 256, H = 128;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);

  const base = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);

  /* Graine tirée de la teinte : deux projets de couleurs voisines n'auront
     pas la même surface, et la même couleur redonnera toujours la même. */
  const seed = Math.round(hsl.h * 100000) + 7919;
  const n1 = makeNoise(seed);
  const n2 = makeNoise(seed * 3 + 101);

  const shade = new THREE.Color();

  for (let y = 0; y < H; y++) {
    const v = y / H;
    /* Latitude : 0 à l'équateur, 1 aux pôles. */
    const lat = Math.abs(v - 0.5) * 2;
    for (let x = 0; x < W; x++) {
      const u = x / W;

      /* Déformation du domaine, puis lecture écrasée en X pour les bandes. */
      const wx = u * 8 + fbm(n2, u * 4, v * 4, 3) * 1.6;
      const wy = v * 26 + fbm(n2, u * 3 + 5, v * 3, 2) * 2.2;
      let t = fbm(n1, wx, wy, 5);

      /* Les calottes lissent la turbulence et éclaircissent. */
      const cap = Math.pow(lat, 3.2);
      t = t * (1 - cap) + 0.78 * cap;

      const l = Math.min(0.94, Math.max(0.05, hsl.l - 0.2 + t * 0.55));
      shade.setHSL(hsl.h, hsl.s * (0.45 + (1 - lat) * 0.55), l);

      const i = (y * W + x) * 4;
      img.data[i] = shade.r * 255;
      img.data[i + 1] = shade.g * 255;
      img.data[i + 2] = shade.b * 255;
      img.data[i + 3] = 255;
    }
  }

  g.putImageData(img, 0, 0);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Anneau : des bandes concentriques d'opacités inégales, avec une division
 * franche. C'est l'irrégularité qui fait l'anneau — une couronne unie
 * ressemblerait à un cerceau posé là.
 */
function ringTexture(hex: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 1;
  const g = c.getContext("2d")!;
  const base = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);

  let seed = 90001;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

  for (let x = 0; x < 128; x++) {
    const t = x / 128;
    /* La division de Cassini : un vide net, sans quoi l'anneau est une bouillie. */
    const gap = t > 0.52 && t < 0.60 ? 0.06 : 1;
    const a = (0.22 + next() * 0.62) * gap * Math.sin(t * Math.PI) ** 0.4;
    const band = new THREE.Color().setHSL(hsl.h, hsl.s * 0.5, 0.72 + next() * 0.2);
    g.fillStyle = `rgba(${Math.round(band.r * 255)},${Math.round(band.g * 255)},${Math.round(band.b * 255)},${a.toFixed(3)})`;
    g.fillRect(x, 0, 1, 1);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Photosphère.
 *
 * Une étoile n'a pas de bandes : elle bout. Deux bruits fractals se
 * combinent — un large qui pose les cellules de convection, un fin qui les
 * granule — et le résultat traverse une rampe chaude, du rouge sombre des
 * intervalles au blanc du cœur des cellules. Le passage est volontairement
 * brutal dans les hautes valeurs : c'est ce qui fait des points incandescents
 * plutôt qu'une purée orange uniforme.
 *
 * Deux taches sombres viennent rompre la régularité. Sans elles, la surface
 * est trop égale pour qu'on la croie.
 */
function sunTexture() {
  const W = 384, H = 192;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);

  const nBig = makeNoise(31337);
  const nFine = makeNoise(90210);
  const nSpot = makeNoise(555);

  /* Rampe de la photosphère, du plus froid au plus chaud. */
  const RAMP: [number, number, number, number][] = [
    [0.00, 0x5c, 0x18, 0x02],
    [0.30, 0xc4, 0x4c, 0x0c],
    [0.55, 0xf5, 0x92, 0x22],
    [0.74, 0xff, 0xc9, 0x5c],
    [0.88, 0xff, 0xec, 0xb0],
    [1.00, 0xff, 0xfd, 0xf0],
  ];
  function ramp(t: number, out: [number, number, number]) {
    for (let i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0] || i === RAMP.length - 1) {
        const a = RAMP[i - 1], b = RAMP[i];
        const k = Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])));
        out[0] = a[1] + (b[1] - a[1]) * k;
        out[1] = a[2] + (b[2] - a[2]) * k;
        out[2] = a[3] + (b[3] - a[3]) * k;
        return;
      }
    }
  }

  const rgb: [number, number, number] = [0, 0, 0];

  for (let y = 0; y < H; y++) {
    const v = y / H;
    for (let x = 0; x < W; x++) {
      const u = x / W;

      const cells = fbm(nBig, u * 14, v * 7, 4);
      const grain = fbm(nFine, u * 38, v * 19, 3);
      /* Le grain module les cellules au lieu de s'y ajouter : les creux
         restent creux, les crêtes se détaillent. */
      let t = cells * 0.72 + grain * 0.28;
      t = Math.pow(Math.min(1, Math.max(0, (t - 0.18) / 0.68)), 0.78);

      /* Taches : là où le bruit dédié dépasse un seuil, la surface refroidit. */
      const spot = fbm(nSpot, u * 5 + 2, v * 2.5, 2);
      if (spot > 0.66) t *= 1 - Math.min(0.82, (spot - 0.66) * 5.2);

      ramp(t, rgb);
      const i = (y * W + x) * 4;
      img.data[i] = rgb[0];
      img.data[i + 1] = rgb[1];
      img.data[i + 2] = rgb[2];
      img.data[i + 3] = 255;
    }
  }

  g.putImageData(img, 0, 0);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Body = { mesh: THREE.Mesh; pivot: THREE.Object3D; item: Realisation; speed: number; spin: number };

export default function SolarCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLAnchorElement>(null);
  /* L'état ne suit pas la position — seulement l'identité du survolé, qui ne
     change que lorsque le curseur entre ou sort d'une planète. La position,
     elle, s'écrit sur le nœud à chaque frame, sans repasser par React. */
  const [hover, setHover] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 260);
    const baseZ = small ? 54 : 46;
    camera.position.set(0, 11.5, baseZ);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.35));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    /* ── L'étoile ─────────────────────────────────────────────────────────
       La granulation compte : un disque d'une seule couleur est une gommette.
       Une photosphère est un grain de cellules de convection, et c'est ce
       grain qui donne l'échelle — sans lui l'astre pourrait aussi bien être
       une bille de dix centimètres. */
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 48, 32),
      new THREE.MeshBasicMaterial({ map: sunTexture() }),
    );
    sun.rotation.z = 0.24;
    scene.add(sun);

    const corona = glowTexture("rgba(255,255,255,0.95)", "rgba(255,178,72,0.42)");
    [
      { s: 7.5, o: 0.92 },
      { s: 17, o: 0.42 },
      { s: 38, o: 0.16 },
    ].forEach(({ s, o }) => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: corona,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: o,
          depthWrite: false,
        }),
      );
      sprite.scale.setScalar(s);
      scene.add(sprite);
    });

    scene.add(new THREE.PointLight(0xffd9a0, 460, 0, 2).translateY(0));
    scene.add(new THREE.AmbientLight(0x2b3a5c, 1.1));

    /* ── Les planètes et leurs trajectoires ─────────────────────────────── */
    const bodies: Body[] = LIVE.map((item, i) => {
      const o = ORBITS[i % ORBITS.length];
      const color = new THREE.Color(item.accent);

      const pivot = new THREE.Object3D();
      pivot.rotation.x = o.incl;
      pivot.rotation.z = o.tiltZ;
      /* Le nombre d'or étale les positions de départ, quel que soit le nombre. */
      pivot.rotation.y = ((i * 137.508) % 360) * (Math.PI / 180);
      scene.add(pivot);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(o.size, small ? 20 : 40, small ? 14 : 28),
        new THREE.MeshStandardMaterial({
          map: planetTexture(item.accent),
          roughness: 0.82,
          metalness: 0.06,
        }),
      );
      mesh.position.x = o.radius;
      /* Inclinaison de l'axe : aucune planète ne tourne parfaitement droite,
         et six axes identiques donnent une maquette. */
      mesh.rotation.z = 0.18 + ((i * 0.37) % 0.42);
      pivot.add(mesh);

      /* Un anneau sur la plus grosse. C'est le signe le plus reconnaissable
         d'un système solaire : une seule silhouette annelée et la lecture est
         immédiate. Deux faces, sinon l'anneau disparaît vu de dessous. */
      if (o.ring) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(o.size * 1.55, o.size * 2.45, 72),
          new THREE.MeshBasicMaterial({
            map: ringTexture(item.accent),
            transparent: true,
            opacity: 0.75,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }

      /* La traînée.
         Le tracé n'est pas d'une teinte uniforme : il est vif juste derrière
         la planète et s'éteint en remontant l'orbite. C'est ce dégradé qui
         donne le sens de la marche — une ellipse d'un seul ton ne dit pas
         dans quelle direction on tourne. La ligne étant fille du pivot, elle
         tourne avec la planète : le dégradé reste calé sans un calcul par
         frame. Fusion additive, donc le noir vaut transparent. */
      const SEG = 168;
      const positions = new Float32Array((SEG + 1) * 3);
      const colors = new Float32Array((SEG + 1) * 3);
      for (let k = 0; k <= SEG; k++) {
        const a = (k / SEG) * Math.PI * 2;
        positions[k * 3] = Math.cos(a) * o.radius;
        positions[k * 3 + 2] = -Math.sin(a) * o.radius;
        /* k = 0 est la position de la planète ; on s'éteint en s'en éloignant,
           avec un plancher pour que l'orbite entière reste devinable. */
        const fade = Math.pow(1 - k / SEG, 2.4) * 0.92 + 0.07;
        colors[k * 3] = color.r * fade;
        colors[k * 3 + 1] = color.g * fade;
        colors[k * 3 + 2] = color.b * fade;
      }
      const trail = new THREE.BufferGeometry();
      trail.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      trail.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const line = new THREE.Line(
        trail,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      pivot.add(line);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture(`#${color.getHexString()}`, `#${color.getHexString()}`),
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        }),
      );
      halo.scale.setScalar(o.size * 3.1);
      mesh.add(halo);

      return { mesh, pivot, item, speed: (Math.PI * 2) / o.period, spin: 0.22 + (i % 3) * 0.1 };
    });

    /* ── Le ciel ────────────────────────────────────────────────────────── */
    const starCount = small ? 800 : 1500;
    const pos = new Float32Array(starCount * 3);
    let s2 = 20261;
    const rnd = () => (s2 = (s2 * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < starCount; i++) {
      /* Répartition sur une coquille : un cube donnerait des coins visibles. */
      const th = Math.acos(2 * rnd() - 1);
      const ph = rnd() * Math.PI * 2;
      const r = 96 + rnd() * 70;
      pos[i * 3] = r * Math.sin(th) * Math.cos(ph);
      pos[i * 3 + 1] = r * Math.cos(th);
      pos[i * 3 + 2] = r * Math.sin(th) * Math.sin(ph);
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(pos, 3)),
      new THREE.PointsMaterial({
        size: 0.5,
        map: glowTexture("rgba(255,255,255,1)", "rgba(200,220,255,0.5)"),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    scene.add(stars);

    /* ── Dimensionnement ────────────────────────────────────────────────── */
    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ── Survol : la planète sous le curseur devient un lien ────────────── */
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2(-2, -2);
    let hovered: Body | null = null;

    function onMove(e: PointerEvent) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    /* ── La boucle ──────────────────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    function frame() {
      raf = 0;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      for (const b of bodies) {
        b.pivot.rotation.y += b.speed * dt;
        b.mesh.rotation.y += b.spin * dt;
      }

      /* La scène s'approche à la descente, et respire très lentement au repos. */
      const progress = Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 2.2));
      camera.position.z = baseZ - progress * 16 + Math.sin(t * 0.07) * 0.9;
      camera.position.y = 11.5 - progress * 5.2;
      camera.lookAt(0, 0, 0);
      stars.rotation.y = t * 0.0045;

      /* Le survol ne coûte un lancer de rayon que lorsque le curseur a bougé. */
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(bodies.map((b) => b.mesh), false)[0];
      const next = hit ? bodies.find((b) => b.mesh === hit.object) ?? null : null;
      if (next !== hovered) {
        hovered = next;
        setHover(next ? { name: next.item.name, slug: next.item.slug } : null);
        renderer.domElement.style.cursor = next ? "pointer" : "";
      }
      if (hovered && tipRef.current) {
        const v = hovered.mesh.getWorldPosition(new THREE.Vector3()).project(camera);
        const r = renderer.domElement.getBoundingClientRect();
        tipRef.current.style.transform = `translate(-50%, -140%) translate(${((v.x + 1) / 2) * r.width}px, ${((-v.y + 1) / 2) * r.height}px)`;
      }

      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      renderer.render(scene, camera);
      running = false;
    } else {
      raf = requestAnimationFrame(frame);
    }

    /* Onglet caché : plus une frame. */
    function onVisibility() {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduced && !running) {
        running = true;
        clock.getDelta();
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      corona.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <>
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
      {/* Étiquette de survol. C'est un vrai lien : la planète est cliquable
          sans que le canvas ait à gérer la navigation. */}
      <Link
        ref={tipRef}
        href={hover ? `/realisations/${hover.slug}` : "/realisations"}
        aria-hidden={hover ? undefined : true}
        tabIndex={hover ? 0 : -1}
        className="absolute left-0 top-0 z-10 whitespace-nowrap rounded-full border border-white/20 bg-[#050810]/85 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-opacity duration-200"
        style={{ opacity: hover ? 1 : 0, pointerEvents: hover ? "auto" : "none" }}
      >
        {hover?.name ?? " "}
      </Link>
    </>
  );
}
