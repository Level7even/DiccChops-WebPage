// ═══════════════════════════════════════
//  STARFRONT — main.js
//  Bootstrap + window resize
// ═══════════════════════════════════════

(function () {
    function init() {
        const canvas = document.getElementById('game-canvas');
        const mm = document.getElementById('minimap-canvas');
        if (!canvas || !mm) {
            console.error('STARFRONT: missing canvas elements');
            return;
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        const game = new Game(canvas, mm);
        window.game = game;
        game.start();

        window.addEventListener('resize', () => {
            resize();
            game.resize(canvas.width, canvas.height);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
