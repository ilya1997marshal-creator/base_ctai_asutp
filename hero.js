/**
 * Заголовок на главной: «декодирование» текста.
 * Каждая буква мелькает случайными знаками и встаёт на место слева направо,
 * с небольшим разбросом по времени. Клик по заголовку запускает заново.
 */
(function () {
    var el = document.getElementById('hero-title');
    if (!el) return;

    var line = el.querySelector('.t-line');
    if (!line) return;

    var TEXT = 'ЦТАИ АСУ ТП';
    var LEAD = 4;                       // «ЦТАИ» — акцентная часть
    var GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789#%*+=/<>';
    var FLICKER = 0.055;                // как часто меняется случайный знак
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var cells = [];
    var running = false;
    var clock = 0;
    var last = 0;
    var raf = 0;

    for (var i = 0; i < TEXT.length; i++) {
        var s = document.createElement('span');
        s.className = 'c' + (TEXT[i] === ' ' ? ' sp' : '');
        s.setAttribute('aria-hidden', 'true');
        if (TEXT[i] === ' ') s.textContent = ' ';
        line.appendChild(s);
        cells.push({ el: s, to: TEXT[i], lead: i < LEAD, sp: TEXT[i] === ' ', at: 0, tick: 0, done: false });
    }

    function classes(cell, settled) {
        return 'c' + (settled ? ' ok' : '') + (cell.lead ? ' lead' : '') + (cell.sp ? ' sp' : '');
    }

    function paint(cell, settled) {
        cell.el.textContent = cell.to;
        cell.el.className = classes(cell, settled);
    }

    function settleAll() {
        cells.forEach(function (c) { paint(c, true); });
    }

    if (reduce) {
        settleAll();
        return;
    }

    function loop(now) {
        var dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        clock += dt;

        var left = 0;
        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            if (c.done) continue;

            if (clock >= c.at) {
                c.done = true;
                paint(c, true);
            } else {
                left++;
                if (c.to !== ' ' && clock >= c.tick) {
                    c.el.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
                    c.tick = clock + FLICKER;
                }
            }
        }

        if (!left) {
            running = false;
            return;
        }
        raf = requestAnimationFrame(loop);
    }

    function scramble() {
        if (running) return;
        running = true;
        clock = 0;
        last = performance.now();

        cells.forEach(function (c, i) {
            c.done = false;
            c.tick = 0;
            c.at = 0.14 + i * 0.045 + Math.random() * 0.22;
            c.el.className = classes(c, false);
        });

        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
    }

    scramble();
    el.addEventListener('click', scramble);
})();
