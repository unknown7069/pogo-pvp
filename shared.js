// Simple shared state across pages using localStorage
// Exposes window.AppState with get/set/remove/clear helpers
(function (global) {
  const STORAGE_KEY = 'pogo-pvp-state';

  function safeParse(json) {
    try {
      return json ? JSON.parse(json) : {};
    } catch (_) {
      return {};
    }
  }

  let state = safeParse(localStorage.getItem(STORAGE_KEY));

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // noop if storage unavailable
    }
  }

  const api = {
    get(key, fallback = null) {
      return Object.prototype.hasOwnProperty.call(state, key)
        ? state[key]
        : fallback;
    },
    set(key, value) {
      state[key] = value;
      save();
    },
    remove(key) {
      delete state[key];
      save();
    },
    clear() {
      state = {};
      save();
    },
  };

  global.AppState = api;

  // UI helpers namespace
  const UI = (global.UI = global.UI || {});

  // Attach drag-to-scroll behavior to a scrollable element (vertical).
  // Adds/removes the 'dragging' class and suppresses the click immediately
  // following a drag gesture to avoid accidental activations.
  UI.attachDragScroll = function attachDragScroll(el) {
    if (!el) return () => {};

    let isDown = false;
    let startY = 0;
    let startScrollTop = 0;
    let didDrag = false;
    let suppressNextClick = false;

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDown = true;
      el.classList.add('dragging');
      startY = e.clientY;
      startScrollTop = el.scrollTop;
      didDrag = false;
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 5) didDrag = true;
      el.scrollTop = startScrollTop - dy;
    };

    const onPointerUp = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('dragging');
      if (didDrag) {
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 0);
      }
    };

    const onClickCapture = (e) => {
      if (suppressNextClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('click', onClickCapture, true);

    // Return a detach function for cleanup if needed
    return function detach() {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  };
})(window);
