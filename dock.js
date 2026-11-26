/**
 * Нижняя навигация: пружинный индикатор с растяжением.
 * Края пилюли — две отдельные пружины: ведущий край жёсткий, задний мягкий,
 * поэтому при переходе между разделами пилюля тянется, как резиновая.
 */
(function () {
    var track = document.getElementById('dock-tabs');
    var ind = document.getElementById('dock-ind');
    if (!track || !ind) return;

    var btns = Array.prototype.slice.call(track.querySelectorAll('.nav-item'));
    if (!btns.length) return;

    var N = btns.length;
    var rects = [];
    var active = 0;
    var suppress = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var L = { x: 0, v: 0, t: 0, k: 600, c: 44 };
    var R = { x: 0, v: 0, t: 0, k: 600, c: 44 };

    function tune(s, k, c) {
        s.k = k;
        s.c = reduce ? 2 * Math.sqrt(k) : c;
    }

    function step(s, dt) {
        var a = -s.k * (s.x - s.t) - s.c * s.v;
        s.v += a * dt;
        s.x += s.v * dt;
    }

    function measure() {
        var t = track.getBoundingClientRect();
        rects = btns.map(function (b) {
            var r = b.getBoundingClientRect();
            return { left: r.left - t.left, width: r.width };
        });
    }

    function place(i, dir) {
        var r = rects[i] || { left: 0, width: 0 };
        var lead = 820, leadC = 44, trail = 190, trailC = 17;
        if (dir > 0) {
            tune(L, trail, trailC);
            tune(R, lead, leadC);
        } else if (dir < 0) {
            tune(L, lead, leadC);
            tune(R, trail, trailC);
        } else {
            tune(L, 620, 45);
            tune(R, 620, 45);
        }
        L.t = r.left - 3;
        R.t = r.left + r.width + 3;
    }

    var last = performance.now();
    function loop(now) {
        var dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        for (var k = 0; k < 4; k++) {
            step(L, dt / 4);
            step(R, dt / 4);
        }
        var l = Math.min(L.x, R.x);
        var w = Math.max(2, Math.abs(R.x - L.x));
        ind.style.transform = 'translate3d(' + l.toFixed(2) + 'px,0,0)';
        ind.style.width = w.toFixed(2) + 'px';
        requestAnimationFrame(loop);
    }

    window.dockSync = function (i, dir) {
        if (!rects.length) measure();
        if (typeof dir !== 'number') dir = Math.sign(i - active) || 0;
        active = i;
        place(i, dir);
    };

    window.addEventListener('resize', function () {
        measure();
        place(active, 0);
        L.x = L.t;
        R.x = R.t;
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            measure();
            place(active, 0);
            L.x = L.t;
            R.x = R.t;
        });
    }

    /* перетаскивание: пилюля идёт за пальцем и доводится до ближайшего раздела */
    var drag = null;

    track.addEventListener('pointerdown', function (e) {
        drag = { id: e.pointerId, x0: e.clientX, moved: false, cx: (L.t + R.t) / 2 };
    });

    track.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x0;
        if (!drag.moved) {
            if (Math.abs(dx) < 5) return;
            drag.moved = true;
            track.classList.add('dragging');
            try { track.setPointerCapture(e.pointerId); } catch (err) {}
        }
        var c = drag.cx + dx;
        var min = rects[0].left + rects[0].width / 2;
        var max = rects[N - 1].left + rects[N - 1].width / 2;
        if (c < min) c = min - (min - c) * 0.35;
        if (c > max) c = max + (c - max) * 0.35;
        var w = rects[0].width / 2 + 3;
        tune(L, 1400, 62);
        tune(R, 1400, 62);
        L.t = c - w;
        R.t = c + w;
    });

    function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.moved) {
            var c = (L.t + R.t) / 2;
            var best = 0;
            var bd = Infinity;
            rects.forEach(function (r, i) {
                var d = Math.abs(r.left + r.width / 2 - c);
                if (d < bd) { bd = d; best = i; }
            });
            suppress = true;
            if (window.switchTab) window.switchTab(best);
            setTimeout(function () { suppress = false; }, 0);
            track.classList.remove('dragging');
        }
        drag = null;
    }

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener('click', function (e) {
        if (suppress) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    measure();
    place(0, 0);
    L.x = L.t;
    R.x = R.t;
    requestAnimationFrame(loop);
})();
