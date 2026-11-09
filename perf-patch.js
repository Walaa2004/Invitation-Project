/**
 * perf-patch.js
 * Mobile scroll performance patch. It does NOT modify app.js / styles.css / index.html design.
 * Must be loaded AFTER three.js, gsap, ScrollTrigger, lenis and BEFORE app.js.
 */
(function () {
  'use strict';

  var isMobile =
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    window.innerWidth < 768;

  if (!isMobile) return; // Desktop stays exactly as it was

  // ------------------------------------------------------------------
  // 1. CSS: remove the GPU-heavy blur/filter effects on touch devices
  // ------------------------------------------------------------------
  var style = document.createElement('style');
  style.textContent = [
    '.watercolor-card, .nav-monogram, .nav-links, .icon-btn, .modal-backdrop {',
    '  -webkit-backdrop-filter: none !important;',
    '  backdrop-filter: none !important;',
    '}',
    '.watercolor-card { background: rgba(247, 250, 247, 0.88) !important; }',
    '.nav-monogram, .nav-links, .icon-btn { background: rgba(244, 246, 243, 0.92) !important; }',
    '.modal-backdrop { background: rgba(38, 50, 51, 0.85) !important; }',
    '.corner-flora, .parallax-float, .cap-a-svg { filter: none !important; }',
    '.couple-name { text-shadow: none !important; }',
    '.watercolor-backdrop, .paper-grain, .botanical-frame, #webgl-canvas {',
    '  transform: translateZ(0);',
    '  backface-visibility: hidden;',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ------------------------------------------------------------------
  // 2. ScrollTrigger: stop recalculating when the mobile address bar
  //    shows/hides while scrolling
  // ------------------------------------------------------------------
  if (window.ScrollTrigger && typeof ScrollTrigger.config === 'function') {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  // ------------------------------------------------------------------
  // 3. Three.js: wrap the renderer (no changes to app.js needed)
  // ------------------------------------------------------------------
  if (!window.THREE || !THREE.WebGLRenderer) return;

  var OrigRenderer = THREE.WebGLRenderer;

  function PatchedRenderer(params) {
    params = params || {};
    params.antialias = false;
    params.powerPreference = 'default';
    var r = new OrigRenderer(params);

    var origSetPixelRatio = r.setPixelRatio.bind(r);
    var origSetSize = r.setSize.bind(r);
    var origRender = r.render.bind(r);

    // Cap pixel ratio
    r.setPixelRatio = function (v) {
      origSetPixelRatio(Math.min(v, 1.5));
    };

    // Ignore resize events caused only by the address bar (small height change)
    var lastW = 0;
    var lastH = 0;
    r.setSize = function (w, h, updateStyle) {
      if (lastW && w === lastW && Math.abs(h - lastH) < 220) return;
      lastW = w;
      lastH = h;
      origSetSize(w, h, updateStyle);
    };

    // Cap to ~30fps and thin out the floating petals/leaves (hide every 2nd)
    var lastRender = 0;
    var thinned = false;
    r.render = function (scene, camera) {
      var now = performance.now();
      if (now - lastRender < 30) return;
      lastRender = now;

      if (!thinned && scene && scene.children) {
        scene.children.forEach(function (child) {
          if (child.isGroup && child.children.length > 100) {
            child.children.forEach(function (m, i) {
              if (i % 2 === 1) m.visible = false;
            });
            thinned = true;
          }
        });
      }

      origRender(scene, camera);
    };

    return r;
  }

  PatchedRenderer.prototype = OrigRenderer.prototype;

  try {
    THREE.WebGLRenderer = PatchedRenderer;
  } catch (e) {
    // If THREE is frozen, silently fall back to the original renderer
  }
})();