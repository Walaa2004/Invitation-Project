/**
 * Abhinav with Kaviya — 3D Animated Scrolling Wedding Website
 * Three.js + GSAP ScrollTrigger + Interactive Utilities
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. PROCEDURAL WATERCOLOR TEXTURE GENERATORS (Eucalyptus, Olive, Rose Petal)
  // ==========================================================================

  function createEucalyptusLeafTexture(primaryColor, secondaryColor, veinColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(128, 128);

    // Organic eucalyptus coin leaf shape
    ctx.beginPath();
    ctx.moveTo(0, 105);
    ctx.bezierCurveTo(-78, 85, -92, -35, 0, -108);
    ctx.bezierCurveTo(92, -35, 78, 85, 0, 105);
    ctx.closePath();

    const grad = ctx.createRadialGradient(-18, -20, 12, 0, 0, 115);
    grad.addColorStop(0, secondaryColor);
    grad.addColorStop(0.65, primaryColor);
    grad.addColorStop(1, '#4c6655');
    ctx.fillStyle = grad;
    ctx.fill();

    // Soft watercolor blotches
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-22, -25, 38, 0, Math.PI * 2);
    ctx.fill();

    // Center vein
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = veinColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 102);
    ctx.quadraticCurveTo(4, 0, 0, -98);
    ctx.stroke();

    // Side veins
    ctx.lineWidth = 1.2;
    [-45, -10, 25, 55].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(-28, y - 15, -48, y - 28);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y - 8);
      ctx.quadraticCurveTo(28, y - 22, 48, y - 35);
      ctx.stroke();
    });

    ctx.restore();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function createRosePetalTexture(innerColor, midColor, edgeColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(128, 136);

    // Heart-cupped rose petal silhouette
    ctx.beginPath();
    ctx.moveTo(0, 95);
    ctx.bezierCurveTo(-85, 55, -105, -55, -35, -95);
    ctx.bezierCurveTo(-10, -108, 0, -88, 0, -88);
    ctx.bezierCurveTo(0, -88, 10, -108, 35, -95);
    ctx.bezierCurveTo(105, -55, 85, 55, 0, 95);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 95, 0, -100);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.55, midColor);
    grad.addColorStop(1, edgeColor);
    ctx.fillStyle = grad;
    ctx.fill();

    // Delicate petal veins
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#7a4553';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 85);
      ctx.quadraticCurveTo(i * 18, 0, i * 24, -75);
      ctx.stroke();
    }

    ctx.restore();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function createBokehTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 250, 242, 0.95)');
    grad.addColorStop(0.4, 'rgba(218, 196, 168, 0.55)');
    grad.addColorStop(0.75, 'rgba(143, 167, 145, 0.2)');
    grad.addColorStop(1, 'rgba(143, 167, 145, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Helper to bend a PlaneGeometry into an organic curved leaf or cupped petal
  function createCurvedPetalGeometry(width, height, curveDepth) {
    const geo = new THREE.PlaneGeometry(width, height, 8, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const nx = x / (width * 0.5);
      const ny = y / (height * 0.5);
      const z = -curveDepth * (nx * nx * 0.65 + ny * ny * 0.35) + Math.sin(ny * Math.PI * 0.5) * (curveDepth * 0.25);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Build a multi-layered 3D blooming rose cluster
  function create3DRoseBloom(petalMat) {
    const roseGroup = new THREE.Group();
    const layers = [
      { count: 5, radius: 0.12, tilt: 0.35, scale: 0.42 },
      { count: 7, radius: 0.22, tilt: 0.65, scale: 0.62 },
      { count: 9, radius: 0.34, tilt: 0.98, scale: 0.85 },
      { count: 11, radius: 0.46, tilt: 1.25, scale: 1.05 }
    ];

    const baseGeo = createCurvedPetalGeometry(0.65, 0.65, 0.16);

    layers.forEach((layer, lIdx) => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2 + lIdx * 0.4;
        const pivot = new THREE.Group();
        pivot.rotation.y = angle;

        const petal = new THREE.Mesh(baseGeo, petalMat);
        petal.position.set(0, 0.05 * lIdx, layer.radius);
        petal.rotation.x = -layer.tilt;
        petal.scale.setScalar(layer.scale);

        pivot.add(petal);
        roseGroup.add(pivot);
      }
    });

    return roseGroup;
  }

  // ==========================================================================
  // 2. LENIS SMOOTH SCROLL & LOCOMOTIVE PARALLAX ENGINE
  // ==========================================================================

  function initSmoothScrollAndParallax() {
    let lenis = null;

    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.6,
        infinite: false,
      });

      window.lenis = lenis;

      // Provide LocomotiveScroll alias for compatibility
      window.LocomotiveScroll = class LocomotiveScrollAdapter {
        constructor() {
          return lenis;
        }
      };

      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }
    }

    // Smooth Glide Anchor Navigation for all nav links & cues
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          if (window.lenis) {
            window.lenis.scrollTo(targetEl, {
              offset: 0,
              duration: 1.4,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Parallax Scrolling Choreography
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      // 1. Subtle parallax on the watercolor backdrop wash
      gsap.to('.watercolor-backdrop', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        }
      });

      // 2. Parallax motion on botanical corner frames
      const floraTL = document.getElementById('flora-tl');
      const floraTR = document.getElementById('flora-tr');
      const floraBL = document.getElementById('flora-bl');
      const floraBR = document.getElementById('flora-br');

      if (floraTL) {
        gsap.to(floraTL, {
          y: -110,
          rotation: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
          }
        });
      }

      if (floraTR) {
        gsap.to(floraTR, {
          y: -95,
          rotation: 5,
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
          }
        });
      }

      if (floraBL) {
        gsap.fromTo(
          floraBL,
          { y: 80, rotation: 8 },
          {
            y: -30,
            rotation: -2,
            ease: 'none',
            scrollTrigger: {
              trigger: 'body',
              start: 'center bottom',
              end: 'bottom bottom',
              scrub: true
            }
          }
        );
      }

      if (floraBR) {
        gsap.fromTo(
          floraBR,
          { y: 80, rotation: -8 },
          {
            y: -30,
            rotation: 2,
            ease: 'none',
            scrollTrigger: {
              trigger: 'body',
              start: 'center bottom',
              end: 'bottom bottom',
              scrub: true
            }
          }
        );
      }

      // 3. Multi-depth Parallax Elements: Support [data-speed] and Locomotive [data-scroll-speed]
      const parallaxEls = document.querySelectorAll('[data-speed], [data-scroll-speed]');
      parallaxEls.forEach((el) => {
        const rawSpeed = el.getAttribute('data-scroll-speed') || el.getAttribute('data-speed') || '0';
        const speed = parseFloat(rawSpeed);
        if (isNaN(speed) || speed === 0) return;
        const section = el.closest('.scroll-section') || el.parentElement;
        const yOffset = speed * 95;

        gsap.fromTo(
          el,
          { y: -yOffset },
          {
            y: yOffset,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      });
    }

    return lenis;
  }

  // ==========================================================================
  // 3. THREE.JS 3D SCENE & GSAP SCROLL CHOREOGRAPHY
  // ==========================================================================

  function initThreeExperience() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xeaf0ec, 0.032);

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Soft Botanical Lighting
    const ambientLight = new THREE.AmbientLight(0xf6f8f5, 0.95);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfefcf9, 0xc3d4c8, 0.65);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ec, 0.9);
    dirLight.position.set(6, 10, 8);
    scene.add(dirLight);

    const roseRimLight = new THREE.PointLight(0xd49aa7, 0.75, 22);
    roseRimLight.position.set(-5, 3, 5);
    scene.add(roseRimLight);

    // Generate Procedural Watercolor Textures
    const eucalyptusTex1 = createEucalyptusLeafTexture('#67836e', '#9ab59e', '#dce8de');
    const eucalyptusTex2 = createEucalyptusLeafTexture('#7a9470', '#a9c19c', '#e4efe0');
    const rosePetalTex = createRosePetalTexture('#874e5c', '#bc8593', '#edd3da');
    const softBlushPetalTex = createRosePetalTexture('#9e6875', '#d1a1ad', '#f5e4e8');

    const leafMat1 = new THREE.MeshLambertMaterial({
      map: eucalyptusTex1,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    const leafMat2 = new THREE.MeshLambertMaterial({
      map: eucalyptusTex2,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    const roseMat1 = new THREE.MeshLambertMaterial({
      map: rosePetalTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });
    const roseMat2 = new THREE.MeshLambertMaterial({
      map: softBlushPetalTex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide
    });

    // Metallic materials for Botanical Wreath & Intertwined Wedding Rings
    const champagneGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc8b08a,
      metalness: 0.78,
      roughness: 0.24
    });

    const roseGoldMat = new THREE.MeshStandardMaterial({
      color: 0xc69599,
      metalness: 0.72,
      roughness: 0.28
    });

    const sageMetallicMat = new THREE.MeshStandardMaterial({
      color: 0x7c9682,
      metalness: 0.45,
      roughness: 0.42
    });

    // ------------------------------------------------------------------------
    // A. 3D Botanical Arch / Wreath Frame (rotates gently around the scene)
    // ------------------------------------------------------------------------
    const wreathGroup = new THREE.Group();
    scene.add(wreathGroup);

    const outerArchGeo = new THREE.TorusGeometry(3.65, 0.022, 16, 120);
    const outerArchMesh = new THREE.Mesh(outerArchGeo, champagneGoldMat);
    wreathGroup.add(outerArchMesh);

    const innerArchGeo = new THREE.TorusGeometry(3.45, 0.016, 16, 120);
    const innerArchMesh = new THREE.Mesh(innerArchGeo, sageMetallicMat);
    innerArchMesh.rotation.z = 0.25;
    innerArchMesh.rotation.x = 0.08;
    wreathGroup.add(innerArchMesh);

    // Populate the 3D Wreath with Eucalyptus Leaves & Blooming 3D Roses
    const leafGeo = createCurvedPetalGeometry(0.68, 0.85, 0.12);
    const wreathNodeCount = 36;
    for (let i = 0; i < wreathNodeCount; i++) {
      const angle = (i / wreathNodeCount) * Math.PI * 2;
      const radius = 3.55;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Pair of leaves along the arch
      for (let side = -1; side <= 1; side += 2) {
        const leaf = new THREE.Mesh(leafGeo, i % 2 === 0 ? leafMat1 : leafMat2);
        leaf.position.set(
          x + Math.cos(angle) * side * 0.14,
          y + Math.sin(angle) * side * 0.14,
          side * 0.08
        );
        leaf.rotation.z = angle + Math.PI * 0.5 + side * 0.42;
        leaf.rotation.x = side * 0.3;
        const sc = 0.65 + (i % 3) * 0.18;
        leaf.scale.setScalar(sc);
        wreathGroup.add(leaf);
      }
    }

    // Place 4 blooming 3D Dusty Mauve Roses at key focal points on the wreath
    const rosePositions = [
      { angle: Math.PI * 0.78, scale: 0.95 },
      { angle: Math.PI * 0.86, scale: 0.68 },
      { angle: -Math.PI * 0.18, scale: 0.9 },
      { angle: -Math.PI * 0.26, scale: 0.65 }
    ];
    rosePositions.forEach((rp, idx) => {
      const bloom = create3DRoseBloom(idx % 2 === 0 ? roseMat1 : roseMat2);
      bloom.position.set(
        Math.cos(rp.angle) * 3.55,
        Math.sin(rp.angle) * 3.55,
        0.22
      );
      bloom.rotation.x = Math.PI * 0.42;
      bloom.rotation.z = rp.angle - Math.PI * 0.5;
      bloom.scale.setScalar(rp.scale);
      wreathGroup.add(bloom);
    });

    // ------------------------------------------------------------------------
    // B. 3D Intertwined Wedding Rings (featured in Couple & Date sections)
    // ------------------------------------------------------------------------
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, 0.2, -1.5);
    ringsGroup.scale.setScalar(0.01); // starts small and blooms in on scroll
    scene.add(ringsGroup);

    const bandGeo1 = new THREE.TorusGeometry(1.15, 0.075, 32, 100);
    const band1 = new THREE.Mesh(bandGeo1, champagneGoldMat);
    band1.position.x = -0.42;
    band1.rotation.y = 0.45;
    band1.rotation.x = 0.35;
    ringsGroup.add(band1);

    const bandGeo2 = new THREE.TorusGeometry(1.08, 0.068, 32, 100);
    const band2 = new THREE.Mesh(bandGeo2, roseGoldMat);
    band2.position.x = 0.42;
    band2.rotation.y = -0.45;
    band2.rotation.x = -0.35;
    ringsGroup.add(band2);

    // ------------------------------------------------------------------------
    // C. 3D Floating Invitation Card Mesh in Background
    // ------------------------------------------------------------------------
    const card3DGroup = new THREE.Group();
    card3DGroup.position.set(3.4, 0.2, -2.2);
    card3DGroup.rotation.set(0.08, -0.42, 0.05);
    scene.add(card3DGroup);

    const texLoader = new THREE.TextureLoader();
    texLoader.load('assets/invitation-card.png', (cardTex) => {
      cardTex.encoding = THREE.sRGBEncoding;
      const cardGeo = new THREE.BoxGeometry(2.55, 3.4, 0.045);
      const paperBackMat = new THREE.MeshStandardMaterial({
        color: 0xe3ece6,
        roughness: 0.75,
        metalness: 0.05
      });
      const cardFrontMat = new THREE.MeshStandardMaterial({
        map: cardTex,
        roughness: 0.55,
        metalness: 0.05
      });
      const cardMaterials = [
        champagneGoldMat, // right edge
        champagneGoldMat, // left edge
        champagneGoldMat, // top edge
        champagneGoldMat, // bottom edge
        cardFrontMat,     // front face (invitation photo)
        paperBackMat      // back face
      ];
      const cardMesh = new THREE.Mesh(cardGeo, cardMaterials);
      card3DGroup.add(cardMesh);
    });

    // ------------------------------------------------------------------------
    // D. 150 Floating 3D Botanical Petals & Eucalyptus Leaves in a 3D Tunnel
    // ------------------------------------------------------------------------
    const floatingFloraGroup = new THREE.Group();
    scene.add(floatingFloraGroup);

    const petalGeo = createCurvedPetalGeometry(0.42, 0.42, 0.11);
    const floraMaterials = [leafMat1, leafMat2, roseMat1, roseMat2];
    const floatingItems = [];
    const FLORA_COUNT = 135;

    for (let i = 0; i < FLORA_COUNT; i++) {
      const isLeaf = i % 3 !== 0;
      const mat = floraMaterials[i % floraMaterials.length];
      const mesh = new THREE.Mesh(isLeaf ? leafGeo : petalGeo, mat);

      // Distribute across a wide 3D corridor from z = +6 down to z = -22
      const radius = 1.8 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = (Math.random() - 0.5) * 14;
      const z = 5 - Math.random() * 26;

      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const scale = isLeaf ? 0.35 + Math.random() * 0.55 : 0.3 + Math.random() * 0.5;
      mesh.scale.setScalar(scale);

      floatingFloraGroup.add(mesh);
      floatingItems.push({
        mesh,
        baseX: x,
        baseY: y,
        baseZ: z,
        speedY: 0.003 + Math.random() * 0.006,
        rotSpeedX: (Math.random() - 0.5) * 0.012,
        rotSpeedY: (Math.random() - 0.5) * 0.014,
        rotSpeedZ: (Math.random() - 0.5) * 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        swayAmp: 0.15 + Math.random() * 0.35
      });
    }

    // ------------------------------------------------------------------------
    // E. Soft Bokeh Dewdrop Particles
    // ------------------------------------------------------------------------
    const bokehCount = 180;
    const bokehGeo = new THREE.BufferGeometry();
    const bokehPositions = new Float32Array(bokehCount * 3);
    for (let i = 0; i < bokehCount; i++) {
      bokehPositions[i * 3] = (Math.random() - 0.5) * 18;
      bokehPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      bokehPositions[i * 3 + 2] = 6 - Math.random() * 28;
    }
    bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPositions, 3));

    const bokehMat = new THREE.PointsMaterial({
      map: createBokehTexture(),
      size: 0.28,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const bokehPoints = new THREE.Points(bokehGeo, bokehMat);
    scene.add(bokehPoints);

    // ------------------------------------------------------------------------
    // F. Scroll-Driven Camera & 3D Object Choreography (GSAP ScrollTrigger)
    // ------------------------------------------------------------------------
    const scrollState = {
      progress: 0,
      cameraZ: 9.5,
      cameraY: 0,
      cameraX: 0,
      wreathRotZ: 0,
      wreathRotY: 0,
      wreathScale: 1
    };

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Master timeline tied to overall page scroll
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          onUpdate: (self) => {
            scrollState.progress = self.progress;
            const bar = document.getElementById('scroll-progress-bar');
            if (bar) {
              bar.style.height = `${(self.progress * 100).toFixed(1)}%`;
            }
          }
        }
      });

      // Stage 1 -> Stage 2 (Hero to Couple): Camera glides forward, rings emerge & interlock
      masterTl
        .to(
          scrollState,
          {
            cameraZ: 4.8,
            cameraY: 0.25,
            wreathRotZ: Math.PI * 0.45,
            wreathRotY: 0.35,
            wreathScale: 1.12,
            duration: 1,
            ease: 'power1.inOut'
          },
          0
        )
        .to(
          ringsGroup.scale,
          { x: 1.15, y: 1.15, z: 1.15, duration: 0.9, ease: 'back.out(1.4)' },
          0.1
        )
        .to(
          ringsGroup.rotation,
          { y: Math.PI * 1.2, x: 0.25, duration: 1, ease: 'none' },
          0
        )
        .to(
          card3DGroup.position,
          { x: -3.6, y: 0.4, z: -2.8, duration: 1, ease: 'power1.inOut' },
          0
        )
        .to(
          card3DGroup.rotation,
          { y: 0.48, z: -0.06, duration: 1, ease: 'power1.inOut' },
          0
        );

      // Stage 2 -> Stage 3 (Couple to Date & Muhurtham): Camera orbits, wreath frames the date
      masterTl
        .to(
          scrollState,
          {
            cameraZ: 1.2,
            cameraY: -0.2,
            wreathRotZ: Math.PI * 0.95,
            wreathRotY: -0.28,
            wreathScale: 1.25,
            duration: 1,
            ease: 'power1.inOut'
          },
          1
        )
        .to(
          ringsGroup.position,
          { x: 0, y: 1.65, z: -3.2, duration: 1, ease: 'power1.inOut' },
          1
        )
        .to(
          ringsGroup.rotation,
          { y: Math.PI * 2.4, z: 0.35, duration: 1, ease: 'none' },
          1
        )
        .to(
          card3DGroup.position,
          { x: 3.5, y: -0.3, z: -4.5, duration: 1, ease: 'power1.inOut' },
          1
        )
        .to(
          card3DGroup.rotation,
          { y: -0.45, x: 0.12, duration: 1, ease: 'power1.inOut' },
          1
        );

      // Stage 3 -> Stage 4 (Date to Venue & Parking): Fly deeper through the botanical tunnel
      masterTl
        .to(
          scrollState,
          {
            cameraZ: -2.6,
            cameraY: 0.15,
            wreathRotZ: Math.PI * 1.45,
            wreathRotY: 0.22,
            wreathScale: 1.05,
            duration: 1,
            ease: 'power1.inOut'
          },
          2
        )
        .to(
          wreathGroup.position,
          { z: -5.5, duration: 1, ease: 'power1.inOut' },
          2
        )
        .to(
          ringsGroup.position,
          { x: -2.8, y: 0.8, z: -6.8, duration: 1, ease: 'power1.inOut' },
          2
        );

      // Stage 4 -> Stage 5 (Venue to Card & Compliments Finale)
      masterTl
        .to(
          scrollState,
          {
            cameraZ: -5.2,
            cameraY: 0,
            wreathRotZ: Math.PI * 2,
            wreathRotY: 0,
            wreathScale: 1.18,
            duration: 1,
            ease: 'power1.inOut'
          },
          3
        )
        .to(
          wreathGroup.position,
          { z: -9.2, duration: 1, ease: 'power1.inOut' },
          3
        )
        .to(
          ringsGroup.position,
          { x: 0, y: 1.9, z: -9.5, duration: 1, ease: 'power1.inOut' },
          3
        );

      // Section Card Reveal Animations & Nav Highlight
      const sections = document.querySelectorAll('.scroll-section');
      const navLinks = document.querySelectorAll('.nav-link');

      sections.forEach((sec, idx) => {
        const card = sec.querySelector('.reveal-card');
        if (card) {
          gsap.fromTo(
            card,
            {
              y: 55,
              opacity: 0,
              rotateX: 8,
              scale: 0.96
            },
            {
              y: 0,
              opacity: 1,
              rotateX: 0,
              scale: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sec,
                start: 'top 78%',
                end: 'top 35%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }

        ScrollTrigger.create({
          trigger: sec,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => setActiveNav(idx),
          onEnterBack: () => setActiveNav(idx)
        });
      });

      function setActiveNav(activeIndex) {
        navLinks.forEach((link, i) => {
          link.classList.toggle('active', i === activeIndex);
        });
      }
    }

    // ------------------------------------------------------------------------
    // G. Mouse / Touch Parallax & Render Loop
    // ------------------------------------------------------------------------
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const floraTL = document.getElementById('flora-tl');
    const floraTR = document.getElementById('flora-tr');

    window.addEventListener('pointermove', (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;

      // Subtle parallax on the SVG corner botanicals
      if (floraTL && floraTR) {
        const shiftX = mouse.targetX * 10;
        const shiftY = mouse.targetY * 10;
        floraTL.style.transform = `translate3d(${-shiftX}px, ${-shiftY}px, 0) rotate(${mouse.targetX * 1.5}deg)`;
        floraTR.style.transform = `translate3d(${shiftX}px, ${-shiftY}px, 0) rotate(${-mouse.targetX * 1.5}deg)`;
      }
    });

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Dynamic scroll velocity reaction from Lenis
      const scrollVel = (window.lenis && typeof window.lenis.velocity === 'number') ? window.lenis.velocity : 0;
      const velPitch = Math.min(Math.max(scrollVel * 0.0006, -0.3), 0.3);

      // Update Camera with scroll state + gentle mouse parallax + dynamic velocity pitch
      camera.position.x = scrollState.cameraX + mouse.x * 0.55;
      camera.position.y = scrollState.cameraY - mouse.y * 0.4 + Math.sin(elapsed * 0.6) * 0.08 - velPitch * 0.4;
      camera.position.z = scrollState.cameraZ;
      camera.lookAt(mouse.x * 0.25, scrollState.cameraY - mouse.y * 0.2, camera.position.z - 6);

      // Update Wreath rotation & breathing motion
      wreathGroup.rotation.z = scrollState.wreathRotZ + elapsed * 0.04;
      wreathGroup.rotation.y = scrollState.wreathRotY + mouse.x * 0.18;
      wreathGroup.rotation.x = -mouse.y * 0.15;
      wreathGroup.scale.setScalar(scrollState.wreathScale + Math.sin(elapsed * 0.9) * 0.02);

      // Subtle idle rotation on the intertwined wedding rings
      band1.rotation.z = elapsed * 0.35;
      band2.rotation.z = -elapsed * 0.32;

      // Gentle float on the 3D background card
      card3DGroup.position.y += Math.sin(elapsed * 1.4) * 0.0015;

      // Animate all 135 floating 3D petals & eucalyptus leaves (with responsive scroll momentum)
      const velBoost = Math.min(Math.abs(scrollVel) * 0.0015, 0.04);
      for (let i = 0; i < floatingItems.length; i++) {
        const item = floatingItems[i];
        const m = item.mesh;

        m.position.y -= item.speedY + velBoost;
        m.position.x = item.baseX + Math.sin(elapsed * 0.8 + item.swayOffset) * item.swayAmp;

        m.rotation.x += item.rotSpeedX + velBoost * 0.2;
        m.rotation.y += item.rotSpeedY + velBoost * 0.2;
        m.rotation.z += item.rotSpeedZ;

        // Wrap vertically so petals never run out
        if (m.position.y < -8) {
          m.position.y = 8;
        }
      }

      // Gentle drift on bokeh particles
      bokehPoints.rotation.y = elapsed * 0.02 + mouse.x * 0.08;

      renderer.render(scene, camera);
    }

    animate();

    // Responsive resize handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  // ==========================================================================
  // 3. GENERATED VECTOR QR CODES (Wedding Parking & Reception Venue)
  // ==========================================================================

  // Exact 29x29 QR Matrix for https://maps.app.goo.gl/ttpjHp7d5T87crdg7
  const PARKING_QR_MATRIX = [
    '11111110111110001111101111111',
    '10000010101111101110001000001',
    '10111010010101110000101011101',
    '10111010110001111110001011101',
    '10111010010110010001001011101',
    '10000010010100001111001000001',
    '11111110101010101010101111111',
    '00000000101010100111000000000',
    '10110111001000110110001001011',
    '01101001101100000001011010001',
    '11101011100100000110011010110',
    '11111100111011000000100000001',
    '00111011001001111101000101100',
    '00000100011100101111001000111',
    '10111111101000100011101000111',
    '00000000110010111011100010010',
    '00010110111001101011110011010',
    '01111001101011111010110101110',
    '10101010110001110010110110100',
    '00101000101010001101000100100',
    '01111111100101001111111111100',
    '00000000110011001110100011111',
    '11111110111001001001101011010',
    '10000010101010010000100011011',
    '10111010001000111000111110111',
    '10111010110110110000010111001',
    '10111010111101101000110100101',
    '10000010010110010010110111010',
    '11111110111000001010100010010'
  ];

  // Exact 29x29 QR Matrix for https://share.google/ru1OXNdSFIbFyveou
  const RECEPTION_QR_MATRIX = [
    '11111110001001110001001111111',
    '10000010010001110110001000001',
    '10111010000100100101001011101',
    '10111010000000110001101011101',
    '10111010010001011000001011101',
    '10000010100011010001001000001',
    '11111110101010101010101111111',
    '00000000010010100111100000000',
    '10010110100110000101010100000',
    '10010100100100001000011001001',
    '10111111010100001101010001110',
    '00101100000100110011000000110',
    '01000010101010010000101101011',
    '10010101001110000011110000000',
    '01111111001100001110010011111',
    '01000001110101101101111101010',
    '01011111000101100000110000010',
    '00100101000100011100011101001',
    '10011011101111001100011010011',
    '00010100101101001101100110011',
    '10101110101010101000111110100',
    '00000000111111001101100010111',
    '11111110001101101000101010010',
    '10000010111101010000100011111',
    '10111010011000111000111110011',
    '10111010100011110111101111110',
    '10111010011010001011100011101',
    '10000010010010101111101010010',
    '11111110111100100000111010010'
  ];

  function drawQRMatrixToCanvas(targetCanvas, matrix) {
    if (!targetCanvas || !matrix) return;
    const modules = matrix.length;
    const quietZone = 2;
    const totalModules = modules + quietZone * 2;
    const size = targetCanvas.width;
    const ctx = targetCanvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const cellSize = size / totalModules;
    ctx.fillStyle = '#3d5051';

    for (let r = 0; r < modules; r++) {
      const rowStr = matrix[r];
      for (let c = 0; c < modules; c++) {
        if (rowStr[c] === '1') {
          const x = Math.floor((c + quietZone) * cellSize);
          const y = Math.floor((r + quietZone) * cellSize);
          const w = Math.ceil((c + quietZone + 1) * cellSize) - x;
          const h = Math.ceil((r + quietZone + 1) * cellSize) - y;
          ctx.fillRect(x, y, w, h);
        }
      }
    }
  }

  function extractParkingQRCode() {
    const qrCanvas = document.getElementById('parking-qr-canvas');
    const receptionQrCanvas = document.getElementById('reception-qr-canvas');
    const modalQrCanvas = document.getElementById('modal-qr-canvas');

    drawQRMatrixToCanvas(qrCanvas, PARKING_QR_MATRIX);
    drawQRMatrixToCanvas(receptionQrCanvas, RECEPTION_QR_MATRIX);
    drawQRMatrixToCanvas(modalQrCanvas, PARKING_QR_MATRIX);
  }

  // ==========================================================================
  // 4. LIVE COUNTDOWN TO MUHURTHAM (Monday, 14 Dec 2026, 12:00 PM IST)
  // ==========================================================================

  function initCountdown() {
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');
    if (!daysEl) return;

    // Muhurtham: Monday, 14 Dec 2026, 12:00 noon IST (+05:30)
    const targetTime = new Date('2026-12-14T12:00:00+05:30').getTime();

    function updateTimer() {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // ==========================================================================
  // 5. CALENDAR (.ICS) DOWNLOAD & INTERACTIVE 3D CARD TILT + LIGHTBOX MODAL
  // ==========================================================================

  function initInteractiveUI() {
    // .ICS Download Button
    const icsBtn = document.getElementById('download-ics-btn');
    if (icsBtn) {
      icsBtn.addEventListener('click', () => {
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Abhinav and Kaviya Wedding//EN',
          'BEGIN:VEVENT',
          'UID:abhinav-kaviya-wedding-20261214@invitation',
          'DTSTAMP:20261012T120000Z',
          'DTSTART:20261214T063000Z',
          'DTEND:20261214T073000Z',
          'SUMMARY:Wedding of Abhinav with Kaviya',
          'DESCRIPTION:We, Mr. Venugopal K K & Mrs. Bindu K P cordially invite you and your family to the wedding of Abhinav with Kaviya. Muhurtham: 12.00 noon - 1.00 pm. Reception on 16 Dec 2026 at Krishnakripa Kalyanamandapam, Vadakara. Ph: 9447543905.',
          'LOCATION:Reef Club Resort, Eranjikkal, Kozhikode',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Abhinav-Kaviya-Wedding-14-Dec-2026.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // 3D Tilt Effect on the Original Invitation Card Showcase
    const tiltCard = document.getElementById('tilt-card');
    const tiltGlare = document.getElementById('tilt-glare');

    if (tiltCard) {
      tiltCard.addEventListener('pointermove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = (x / rect.width - 0.5) * 2;
        const pctY = (y / rect.height - 0.5) * 2;

        const rotY = pctX * 14;
        const rotX = -pctY * 14;
        tiltCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;

        if (tiltGlare) {
          tiltGlare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.45), transparent 60%)`;
        }
      });

      tiltCard.addEventListener('pointerleave', () => {
        tiltCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    }

    // Lightbox Modal for Full Card & QR Code
    const modal = document.getElementById('lightbox-modal');
    const modalClose = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-img');
    const modalQrContainer = document.getElementById('modal-qr-container');
    const modalQrCanvas = document.getElementById('modal-qr-canvas');
    const qrTrigger = document.getElementById('qr-enlarge-trigger');
    const receptionQrTrigger = document.getElementById('reception-qr-trigger');

    function openModal(mode) {
      if (!modal) return;
      if (window.lenis) window.lenis.stop();
      if (mode === 'qr' || mode === 'reception-qr') {
        const isReception = mode === 'reception-qr';
        modalTitle.textContent = isReception
          ? 'Krishnakripa Kalyanamandapam — Reception QR'
          : 'Reef Club Parking Area — QR Code';
        drawQRMatrixToCanvas(
          modalQrCanvas,
          isReception ? RECEPTION_QR_MATRIX : PARKING_QR_MATRIX
        );
        modalImg.style.display = 'none';
        modalQrContainer.style.display = 'block';
      } else {
        modalTitle.textContent = 'Original Wedding Invitation Card';
        modalImg.style.display = 'block';
        modalQrContainer.style.display = 'none';
      }
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
      if (!modal) return;
      if (window.lenis) window.lenis.start();
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (tiltCard) {
      tiltCard.addEventListener('click', () => openModal('card'));
    }
    if (qrTrigger) {
      qrTrigger.addEventListener('click', () => openModal('qr'));
    }
    if (receptionQrTrigger) {
      receptionQrTrigger.addEventListener('click', () => openModal('reception-qr'));
    }
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Quick Contact / RSVP WhatsApp Form Handler
    const contactForm = document.getElementById('contact-whatsapp-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('guest-name');
        const countInput = document.getElementById('guest-count');
        const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Guest';
        const count = countInput && countInput.value.trim() ? countInput.value.trim() : '1';
        const message = `Hello! I am ${name}. Number of guests attending the wedding of Abhinav and Kaviya on 14 Dec 2026: ${count}`;
        const waUrl = `https://wa.me/919447543905?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      });
    }
  }

  // ==========================================================================
  // 6. GENERATIVE WEB AUDIO AMBIENT CHIMES (Zero external MP3 needed)
  // ==========================================================================

  function initAmbientAudio() {
    const btn = document.getElementById('audio-toggle-btn');
    const label = document.getElementById('audio-label');
    if (!btn) return;

    let audioCtx = null;
    let isPlaying = false;
    let chimeInterval = null;

    // Gentle pentatonic major notes in Hz (C5, D5, E5, G5, A5, C6)
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

    function playHarpNote() {
      if (!audioCtx || !isPlaying) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      const freq = notes[Math.floor(Math.random() * notes.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    }

    btn.addEventListener('click', () => {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      isPlaying = !isPlaying;
      btn.classList.toggle('playing', isPlaying);
      if (label) {
        label.textContent = isPlaying ? 'Playing' : 'Ambience';
      }

      if (isPlaying) {
        playHarpNote();
        chimeInterval = setInterval(playHarpNote, 1800);
      } else if (chimeInterval) {
        clearInterval(chimeInterval);
      }
    });
  }

  // ==========================================================================
  // INITIALIZE ALL MODULES ON DOM READY
  // ==========================================================================

  window.addEventListener('DOMContentLoaded', () => {
    initSmoothScrollAndParallax();
    initThreeExperience();
    extractParkingQRCode();
    initCountdown();
    initInteractiveUI();
    initAmbientAudio();
  });
})();
