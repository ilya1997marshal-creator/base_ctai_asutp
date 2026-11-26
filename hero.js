/**
 * Заголовок на главной: буквы как физические объекты.
 * При появлении каждая падает сверху, приземляется с лёгким сплющиванием
 * и возвращается пружиной. По клику строка осыпается вниз с наклоном
 * и собирается заново.
 *
 * Порт эффекта Dynamic Text (Kokonut UI, MIT) на ванильный JS:
 * без React — те же константы движения, но только нужная часть физики.
 */
(function () {
    var el = document.getElementById('hero-title');
    if (!el) return;

    var line = el.querySelector('.t-line');
    if (!line) return;

    var TEXT = 'ЦТАИ АСУ ТП';
    var LEAD = 4;                       // «ЦТАИ» — акцентная часть

    /* физика: расстояния в em, поэтому масштабируется вместе со шрифтом */
    var GRAVITY = 34;                   // em/с²
    var DROP = 0.62;                    // высота падения, em
    var STAGGER = 0.042;                // с между буквами
    var FALL = 0.7;                     // с до полного исчезновения при осыпании
    var SQUASH_K = 1500;
    var SQUASH_Z = 0.55;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cells = [];
    var em = 28;
    var raf = 0;
    var last = 0;
    var mode = 'idle';                  // idle | in | out
    var started = false;

    for (var i = 0; i < TEXT.length; i++) {
        var ch = TEXT[i];
        var sp = ch === ' ';
        var s = document.createElement('span');
        s.className = 'g' + (i < LEAD ? ' lead' : '') + (sp ? ' sp' : '');
        s.setAttribute('aria-hidden', 'true');
        s.textContent = sp ? '\u00A0' : ch;
        line.appendChild(s);
        cells.push({
            el: s,
            sp: sp,
            lead: i < LEAD,
            y: 0, vy: 0,
            r: 0, vr: 0,
            sq: 0, sqv: 0,
            o: 1,
            delay: 0,
            phase: 'rest'
        });
    }

    function paint(c) {
        var sx = 1 - c.sq * 0.6;
        var sy = 1 + c.sq;
        c.el.style.transform =
            'translate3d(0,' + c.y.toFixed(2) + 'px,0) rotate(' + c.r.toFixed(2) +
            'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
        c.el.style.opacity = c.o.toFixed(3);
    }

    function settle() {
        mode = 'idle';
        cells.forEach(function (c) {
            c.y = 0; c.vy = 0; c.r = 0; c.vr = 0; c.sq = 0; c.sqv = 0;
            c.o = 1; c.phase = 'rest'; c.delay = 0;
            paint(c);
        });
    }

    if (reduce) {
        settle();
        return;
    }

    function measureEm() {
        em = parseFloat(window.getComputedStyle(line).fontSize) || 28;
    }

    function start() {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
    }

    function drop(instant) {
        measureEm();
        mode = 'in';
        cells.forEach(function (c, i) {
            c.phase = 'drop';
            c.y = instant ? 0 : -DROP * em;
            c.vy = 0;
            c.r = 0; c.vr = 0;
            c.sq = 0; c.sqv = 0;
            c.o = instant ? 1 : 0;
            c.delay = instant ? 0 : i * STAGGER + Math.random() * 0.03;
            paint(c);
        });
        start();
    }

    function fall() {
        if (mode === 'out') return;
        measureEm();
        mode = 'out';
        cells.forEach(function (c, i) {
            c.phase = 'fall';
            c.delay = i * 0.02;
            c.vy = Math.max(c.vy, 0);
            // наклон в сторону, где буква стоит
            var side = c.el.offsetLeft + c.el.offsetWidth / 2 < line.offsetWidth / 2 ? -1 : 1;
            c.vr = side * (38 + (i * 13) % 50);
        });
        start();
    }

    function tick(now) {
        var dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;

        var busy = false;
        var gone = 0;

        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];

            if (c.delay > 0) {
                c.delay -= dt;
                busy = true;
                continue;
            }

            if (c.phase === 'drop') {
                c.vy += GRAVITY * em * dt;
                c.y += c.vy * dt;
                c.o = Math.min(1, 1 + c.y / (DROP * em));
                if (c.y >= 0) {
                    c.y = 0;
                    c.vy = 0;
                    c.sq = -0.18;          // приземление: одно сплющивание
                    c.phase = 'rest';
                }
                busy = true;
            } else if (c.phase === 'fall') {
                c.vy += GRAVITY * em * dt;
                c.y += c.vy * dt;
                c.r += c.vr * dt;
                c.o = Math.max(0, c.o - dt / FALL);
                if (c.o <= 0) {
                    c.phase = 'gone';
                    paint(c);
                    gone++;
                    continue;
                }
                busy = true;
            } else if (c.phase === 'gone') {
                gone++;
            }

            if (Math.abs(c.sq) > 0.0005 || Math.abs(c.sqv) > 0.01) {
                var acc = -SQUASH_K * c.sq - 2 * SQUASH_Z * Math.sqrt(SQUASH_K) * c.sqv;
                c.sqv += acc * dt;
                c.sq += c.sqv * dt;
                busy = true;
            } else if (c.sq !== 0) {
                c.sq = 0;
                c.sqv = 0;
            }

            paint(c);
        }

        if (mode === 'out' && gone === cells.length) {
            mode = 'idle';
            raf = 0;
            setTimeout(function () { drop(false); }, 90);
            return;
        }

        if (busy) {
            raf = requestAnimationFrame(tick);
        } else {
            raf = 0;
            mode = 'idle';
        }
    }

    // до показа прелоадера буквы скрыты, чтобы не было вспышки
    cells.forEach(function (c) {
        c.y = -DROP * 28;
        c.o = 0;
        paint(c);
    });

    function reveal() {
        if (started) return;
        started = true;
        measureEm();
        drop(false);
        // страховка: если кадры не идут (фоновая вкладка, троттлинг), просто показываем строку
        setTimeout(function () {
            if (mode === 'in') settle();
        }, 2600);
    }

    if (document.readyState === 'complete') {
        setTimeout(reveal, 1100);
    } else {
        window.addEventListener('load', function () { setTimeout(reveal, 1100); });
    }

    // страховка: если загрузка затянулась, просто показываем строку
    setTimeout(function () {
        if (!started) {
            started = true;
            settle();
        }
    }, 5000);

    el.addEventListener('click', function () {
        if (!started) return;
        if (mode === 'out') return;
        fall();
    });

    window.addEventListener('resize', measureEm);
})();
