/**
 * perf-patch.js  (v2 - with diagnostic switches)
 * Mobile scroll performance patch. Does NOT modify app.js / styles.css / design.
 * Load AFTER three.js, gsap, ScrollTrigger, lenis and BEFORE app.js.
 *
 * Diagnostic: open the site with ?test=... to switch heavy parts off one by one, e.g.
 *   ?test=grain     -> hides paper grain layer
 *   ?test=frame     -> hides corner flowers + floating SVG leaves
 *   ?test=nogl      -> stops all WebGL rendering (3D background)
 *   ?test=keepscrub -> keeps the original parallax (for comparison)
 *   combine: ?test=grain,frame
 */
(function () {
  'use strict';

  var isMobile =
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    window.innerWidth < 768;

  if (!isMobile) return; // Desktop stays exactly as it was

  var test = (new URLSearchParams(location.search).get('test') || '').split(',');
  function has(k) { return test.indexOf(k) > -1; }

  // 1. CSS
  var css = [
    '.watercolor-card, .nav-monogram, .nav-links, .icon-btn, .modal-backdrop {',
    '  -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }',
    '.watercolor-card { background: rgba(247, 250, 247, 0.88) !important; }',
    '.nav-monogram, .nav-links, .icon-btn { background: rgba(244, 246, 243, 0.92) !important; }',
    '.modal-backdrop { background: rgba(38, 50, 51, 0.85) !important; }',
    '.corner-flora, .parallax-float, .cap-a-svg { filter: none !important; }',
    '.couple-name { text-shadow: none !important; }',
    '.corner-flora { transition: none !important; }',
    '.watercolor-card { box-shadow: 0 8px 22px rgba(61, 80, 81, 0.08) !important; }',
    '.reveal-card { will-change: transform, opacity; }',
    '.watercolor-backdrop, .paper-grain, .botanical-frame, #webgl-canvas {',
    '  transform: translateZ(0); backface-visibility: hidden; }'
  ];
  if (has('grain')) css.push('.paper-grain { display: none !important; }');
  if (has('frame')) css.push('.botanical-frame, .parallax-float { display: none !important; }');
  var style = document.createElement('style');
  style.textContent = css.join('\n');
  document.head.appendChild(style);

  // 2. ScrollTrigger
  if (window.ScrollTrigger && typeof ScrollTrigger.config === 'function') {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }
  // Lite mode: stop scroll-scrubbed parallax (elements return to their original CSS position)
  // and make the card reveal faster. Use ?test=keepscrub to turn this off for comparison.
  if (window.ScrollTrigger && !has('keepscrub')) {
    window.addEventListener('load', function () {
      ScrollTrigger.getAll().forEach(function (t) {
        var a = t.animation;
        if (t.vars && t.vars.scrub === true) {
          t.kill();
          if (a && typeof a.revert === 'function') a.revert();
        } else if (a && typeof a.timeScale === 'function' && t.vars && t.vars.toggleActions) {
          a.timeScale(1.8); // reveal cards: ~0.55s instead of 1s
        }
      });
    });
  }

  // 3. Three.js renderer wrapper
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

    r.setPixelRatio = function (v) { origSetPixelRatio(Math.min(v, 1.5)); };

    var lastW = 0, lastH = 0;
    r.setSize = function (w, h, updateStyle) {
      if (lastW && w === lastW && Math.abs(h - lastH) < 220) return;
      lastW = w; lastH = h;
      origSetSize(w, h, updateStyle);
    };

    var lastRender = 0, thinned = false;
    r.render = function (scene, camera) {
      if (has('nogl')) return;
      var now = performance.now();
      if (now - lastRender < 30) return;
      lastRender = now;

      if (!thinned && scene && scene.children) {
        scene.children.forEach(function (child) {
          if (child.isGroup && child.children.length > 100) {
            child.children.forEach(function (m, i) { if (i % 2 === 1) m.visible = false; });
            thinned = true;
          }
        });
      }
      origRender(scene, camera);
    };
    return r;
  }
  PatchedRenderer.prototype = OrigRenderer.prototype;
  try { THREE.WebGLRenderer = PatchedRenderer; } catch (e) {}
})();