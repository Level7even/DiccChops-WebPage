
// This is a port of the public domain implementation of simplex noise from Stefan Gustavson.
// It's been adapted to be a TypeScript class.

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

export default class SimplexNoise {
    private p: number[] = [];
    private perm: number[] = [];
    private permMod12: number[] = [];

    constructor(seed: string) {
        this.reseed(seed);
    }

    private reseed(seed: string) {
        const prng = this.createPrng(seed);
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }

        for (let i = 255; i > 0; i--) {
            const n = Math.floor(prng() * (i + 1));
            const t = this.p[i];
            this.p[i] = this.p[n];
            this.p[n] = t;
        }

        this.perm = [];
        this.permMod12 = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }

    private createPrng(seed: string) {
        let h = 1779033703 ^ seed.length;
        for (let i = 0; i < seed.length; i++) {
            h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function() {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            return ((h ^= h >>> 16) >>> 0) / 4294967296;
        };
    }

    private grad3 = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    private dot2(g: number[], x: number, y: number) {
        return g[0] * x + g[1] * y;
    }

    public noise2D(xin: number, yin: number): number {
        let n0, n1, n2;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) {
            i1 = 1; j1 = 0;
        } else {
            i1 = 0; j1 = 1;
        }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;
        const ii = i & 255;
        const jj = j & 255;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            const g = this.permMod12[ii + this.perm[jj]];
            n0 = t0 * t0 * this.dot2(this.grad3[g], x0, y0);
        }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            const g = this.permMod12[ii + i1 + this.perm[jj + j1]];
            n1 = t1 * t1 * this.dot2(this.grad3[g], x1, y1);
        }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            const g = this.permMod12[ii + 1 + this.perm[jj + 1]];
            n2 = t2 * t2 * this.dot2(this.grad3[g], x2, y2);
        }
        return 70.0 * (n0 + n1 + n2);
    }
}
