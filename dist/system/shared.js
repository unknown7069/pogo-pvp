(function (global) {
    function attachDragScroll(el) {
        if (!el)
            return () => { };
        let isDown = false;
        let startY = 0;
        let startScrollTop = 0;
        let didDrag = false;
        let suppressNextClick = false;
        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0)
                return;
            isDown = true;
            el.classList.add('dragging');
            startY = e.clientY;
            startScrollTop = el.scrollTop;
            didDrag = false;
        };
        const onPointerMove = (e) => {
            if (!isDown)
                return;
            const dy = e.clientY - startY;
            if (Math.abs(dy) > 5)
                didDrag = true;
            el.scrollTop = startScrollTop - dy;
        };
        const onPointerUp = () => {
            if (!isDown)
                return;
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
        return function detach() {
            el.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            el.removeEventListener('click', onClickCapture, true);
        };
    }
    const existing = global.UI || {};
    global.UI = Object.assign({}, existing, { attachDragScroll });
})(window);
