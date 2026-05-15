/* ============================
   Layered — interactivity
   ============================ */
(() => {
    'use strict';

    const isTouch = matchMedia('(hover: none)').matches || matchMedia('(max-width: 720px)').matches;
    const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----- Custom cursor ----- */
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (dot && ring && !isTouch) {
        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        let rx = mx, ry = my;
        window.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
        });
        const loop = () => {
            rx += (mx - rx) * 0.18;
            ry += (my - ry) * 0.18;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            requestAnimationFrame(loop);
        };
        loop();
        document.querySelectorAll('a, button, .btn, .feat-card, .blend-item, .plugin-item, .api-surface, .copy-btn, .layer-card').forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    /* ----- Scroll progress + nav scrolled ----- */
    const progress = document.getElementById('scroll-progress');
    const nav = document.querySelector('nav');
    const onScroll = () => {
        const h = document.documentElement;
        const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
        if (progress) progress.style.width = pct + '%';
        if (nav) nav.classList.toggle('scrolled', h.scrollTop > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ----- Particle canvas ----- */
    const canvas = document.getElementById('particle-canvas');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0, particles = [];
        const COUNT = isTouch ? 28 : 70;
        const colors = ['rgba(255,122,47,', 'rgba(124,58,237,', 'rgba(167,139,250,', 'rgba(255,154,92,'];

        const resize = () => {
            W = canvas.width = window.innerWidth * devicePixelRatio;
            H = canvas.height = window.innerHeight * devicePixelRatio;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        };
        const spawn = () => {
            particles = [];
            for (let i = 0; i < COUNT; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
                    vy: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
                    r: (Math.random() * 1.6 + 0.4) * devicePixelRatio,
                    a: Math.random() * 0.5 + 0.2,
                    c: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };
        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            for (const p of particles) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.fillStyle = p.c + p.a + ')';
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            // connect nearby
            const maxD = 110 * devicePixelRatio;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i], b = particles[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < maxD * maxD) {
                        const alpha = (1 - Math.sqrt(d2) / maxD) * 0.12;
                        ctx.strokeStyle = `rgba(255,122,47,${alpha})`;
                        ctx.lineWidth = 0.5 * devicePixelRatio;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(draw);
        };
        resize(); spawn(); draw();
        window.addEventListener('resize', () => { resize(); spawn(); });
    }

    /* ----- Scroll reveal ----- */
    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
    setTimeout(() => {
        reveals.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight) el.classList.add('in');
        });
    }, 100);

    /* ----- Copy buttons ----- */
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.copy);
                const original = btn.textContent;
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1800);
            } catch (e) { /* clipboard blocked */ }
        });
    });

    /* ----- Animated counters ----- */
    const counters = document.querySelectorAll('[data-count]');
    const countIo = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const target = parseInt(el.dataset.count, 10);
            let cur = 0;
            const step = Math.max(1, Math.ceil(target / 30));
            const tick = () => {
                cur += step;
                if (cur >= target) { el.textContent = target; return; }
                el.textContent = cur;
                requestAnimationFrame(tick);
            };
            tick();
            countIo.unobserve(el);
        });
    }, { threshold: 0.4 });
    counters.forEach(c => countIo.observe(c));

    /* ----- 3D tilt on feature cards ----- */
    if (!isTouch && !prefersReducedMotion) {
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `perspective(800px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg) translateZ(0)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    /* ----- Spark burst on download clicks ----- */
    document.querySelectorAll('[data-burst]').forEach(btn => {
        btn.addEventListener('click', e => {
            btn.classList.remove('burst-anim');
            void btn.offsetWidth;
            btn.classList.add('burst-anim');
            const r = btn.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            for (let i = 0; i < 16; i++) {
                const s = document.createElement('div');
                s.className = 'spark';
                const size = 4 + Math.random() * 5;
                s.style.width = s.style.height = size + 'px';
                s.style.background = Math.random() > 0.5 ? '#ff7a2f' : '#ff9a5c';
                s.style.left = cx + 'px';
                s.style.top = cy + 'px';
                s.style.boxShadow = '0 0 8px #ff7a2f';
                document.body.appendChild(s);
                const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.6;
                const dist = 60 + Math.random() * 70;
                s.animate([
                    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                    { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 }
                ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.3,1)' })
                  .onfinish = () => s.remove();
            }
        });
    });

    /* ----- Hero headline scramble ----- */
    const h1 = document.querySelector('[data-scramble]');
    if (h1 && !prefersReducedMotion) {
        const finalHTML = h1.dataset.final;
        // Strip tags for the scramble phase, then restore full HTML at the end.
        const tmp = document.createElement('div');
        tmp.innerHTML = finalHTML;
        const finalText = tmp.textContent;
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        h1.textContent = '';
        let frame = 0;
        const queue = [];
        for (let i = 0; i < finalText.length; i++) {
            const start = Math.floor(Math.random() * 30);
            const end = start + Math.floor(Math.random() * 30) + 10;
            queue.push({ to: finalText[i], start, end, char: '' });
        }
        const tick = () => {
            let out = '';
            let done = 0;
            for (const q of queue) {
                if (frame >= q.end) { out += q.to; done++; }
                else if (frame >= q.start) {
                    if (!q.char || Math.random() < 0.28) q.char = chars[Math.floor(Math.random() * chars.length)];
                    out += `<span style="color:var(--orange2);opacity:.85">${q.char}</span>`;
                } else { out += ' '; }
            }
            h1.innerHTML = out + '<span class="scramble-cursor"></span>';
            if (done === queue.length) {
                h1.innerHTML = finalHTML;
                return;
            }
            frame++;
            setTimeout(tick, 30);
        };
        tick();
    }

    /* ----- Code block typing ----- */
    const codeEl = document.getElementById('code-body');
    if (codeEl) {
        const lines = [
            ['kw', 'from'], [null, ' PIL '], ['kw', 'import'], [null, ' Image, ImageOps\n'],
            ['kw', 'from'], [null, ' app.plugin_api '], ['kw', 'import'], [null, ' '], ['cl', 'Plugin'], [null, ', '], ['cl', 'PluginContext'], [null, '\n\n'],
            ['cm', '# Runs sandboxed — crashes are logged,'], [null, '\n'],
            ['cm', '# the editor stays alive.'], [null, '\n\n'],
            ['kw', 'class'], [null, ' '], ['cl', 'GrayscalePlugin'], [null, '('], ['cl', 'Plugin'], [null, '):\n'],
            [null, '    '], ['at', 'name'], [null, '    = '], ['st', '"Grayscale"'], [null, '\n'],
            [null, '    '], ['at', 'version'], [null, ' = '], ['st', '"1.0.0"'], [null, '\n\n'],
            [null, '    '], ['df', 'def'], [null, ' '], ['fn', 'register'], [null, '('], ['at', 'self'], [null, ', ctx: '], ['cl', 'PluginContext'], [null, ') -> '], ['kw', 'None'], [null, ':\n'],
            [null, '        ctx.'], ['fn', 'register_filter'], [null, '('], ['st', '"Grayscale"'], [null, ', '], ['at', 'self'], [null, '.apply)\n\n'],
            [null, '    '], ['at', '@staticmethod'], [null, '\n'],
            [null, '    '], ['df', 'def'], [null, ' '], ['fn', 'apply'], [null, '(image: '], ['cl', 'Image'], [null, ') -> '], ['cl', 'Image'], [null, ':\n'],
            [null, '        '], ['kw', 'return'], [null, ' ImageOps.'], ['fn', 'grayscale'], [null, '(\n'],
            [null, '            image.'], ['fn', 'convert'], [null, '('], ['st', '"RGB"'], [null, ')\n'],
            [null, '        ).'], ['fn', 'convert'], [null, '('], ['st', '"RGBA"'], [null, ')']
        ];

        // Pre-render with whitespace-pre so newlines/spaces render literally.
        codeEl.style.whiteSpace = 'pre-wrap';

        const start = () => {
            if (codeEl.dataset.started) return;
            codeEl.dataset.started = '1';
            if (prefersReducedMotion) {
                codeEl.innerHTML = lines.map(([cls, txt]) => cls ? `<span class="${cls}">${escape(txt)}</span>` : escape(txt)).join('') + '<span class="type-cursor"></span>';
                return;
            }
            let li = 0, ci = 0;
            const buf = [];
            const cursor = '<span class="type-cursor"></span>';
            const step = () => {
                if (li >= lines.length) {
                    codeEl.innerHTML = buf.join('') + cursor;
                    return;
                }
                const [cls, txt] = lines[li];
                const next = txt[ci];
                ci++;
                // Build current rendered string
                const renderedLines = lines.slice(0, li).map(([c, t]) => c ? `<span class="${c}">${escape(t)}</span>` : escape(t)).join('');
                const partial = txt.slice(0, ci);
                const partialRendered = cls ? `<span class="${cls}">${escape(partial)}</span>` : escape(partial);
                codeEl.innerHTML = renderedLines + partialRendered + cursor;
                if (ci >= txt.length) { li++; ci = 0; }
                const delay = /\n/.test(next || '') ? 40 : (txt.length > 6 ? 8 : 18);
                setTimeout(step, delay);
            };
            step();
        };
        const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        new IntersectionObserver((entries, obs) => {
            entries.forEach(e => { if (e.isIntersecting) { start(); obs.disconnect(); } });
        }, { threshold: 0.25 }).observe(codeEl);
    }

    /* ----- GitHub release fetch + changelog + toast ----- */
    const STORAGE_KEY = 'layered-seen-version';
    fetch('https://api.github.com/repos/NightHawkHSI/Layered/releases?per_page=6')
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(releases => {
            if (!Array.isArray(releases) || !releases.length) return;
            const latest = releases[0];
            const tag = latest.tag_name || latest.name;
            if (tag) {
                const heroBtn = document.getElementById('dl-hero-btn');
                if (heroBtn) heroBtn.textContent = `↓ Download ${tag}`;
                const relBtn = document.getElementById('dl-release-btn');
                if (relBtn) relBtn.textContent = `↓ Download ${tag} for Windows`;
                const badge = document.getElementById('nav-version-badge');
                if (badge) badge.textContent = tag;
            }
            // Changelog list
            const list = document.getElementById('changelog-list');
            if (list) {
                list.innerHTML = releases.map((r, i) => {
                    const date = r.published_at ? new Date(r.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    const body = (r.body || '').split('\n').slice(0, 3).map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0, 2).join(' · ') || 'See GitHub for details.';
                    const safe = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    return `<li class="cl-item">
                        <div class="cl-dot${i === 0 ? ' latest' : ''}"></div>
                        <div class="cl-body">
                            <span class="cl-tag${i === 0 ? '' : ' dim'}">${r.tag_name || r.name}</span>
                            <div class="cl-date">${date}</div>
                            <div class="cl-desc">${safe}</div>
                        </div>
                    </li>`;
                }).join('');
            }
            // Version toast
            try {
                const seen = localStorage.getItem(STORAGE_KEY);
                if (seen && seen !== tag) {
                    const toast = document.getElementById('version-toast');
                    document.getElementById('toast-title').textContent = `${tag} just shipped`;
                    document.getElementById('toast-sub').textContent = 'Click for release notes';
                    if (toast) {
                        toast.style.cursor = 'pointer';
                        toast.addEventListener('click', e => {
                            if (e.target.id === 'toast-close') return;
                            window.open(latest.html_url, '_blank', 'noopener');
                        });
                        setTimeout(() => toast.classList.add('show'), 1500);
                    }
                }
                localStorage.setItem(STORAGE_KEY, tag);
            } catch (e) { /* storage blocked */ }
        })
        .catch(() => {
            const list = document.getElementById('changelog-list');
            if (list) {
                list.innerHTML = `<li class="cl-item">
                    <div class="cl-dot latest"></div>
                    <div class="cl-body">
                        <span class="cl-tag">Offline</span>
                        <div class="cl-date">GitHub API unreachable</div>
                        <div class="cl-desc">View the full changelog on the <a href="https://github.com/NightHawkHSI/Layered/releases" style="color:var(--orange2)">releases page ↗</a>.</div>
                    </div>
                </li>`;
            }
        });

    /* ----- Toast close ----- */
    const tc = document.getElementById('toast-close');
    if (tc) tc.addEventListener('click', () => document.getElementById('version-toast').classList.remove('show'));

})();
