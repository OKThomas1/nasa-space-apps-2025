import { PNG } from "pngjs"

function normalize(x: number, low: number, high: number): number {
    if (x < 0) return 0
    return Math.max(0, Math.min(1, (x - low) / (high - low)))
}

export const calculatePollutionScore = (tempoBuffer: DataView) => {
    if (tempoBuffer.byteLength !== 4 * 3 * 256 * 256)
        throw new Error(
            "Expected buffer of length " +
                4 * 3 * 256 * 256 +
                " found length " +
                tempoBuffer.byteLength
        )
    const scores = new Uint32Array(256 * 256)
    const stats = Array.from({ length: 3 }).map(() => ({ min: Infinity, max: -Infinity, mean: 0 }))
    for (let i = 0; i < tempoBuffer.byteLength; i += 12) {
        for (let j = 0; j < 3; j++) {
            const num = tempoBuffer.getFloat32(i + j * 4, true)
            stats[j].min = Math.min(stats[j].min, num)
            stats[j].max = Math.max(stats[j].max, num)
            stats[j].mean += num / (256 * 256)
        }

        const a = tempoBuffer.getFloat32(i, true)
        const b = tempoBuffer.getFloat32(i + 4, true)
        const c = tempoBuffer.getFloat32(i + 8, true)

        const nNo2 = normalize(a, 1e15, 5e15)
        const nHcho = normalize(b, 5e15, 2e16)
        const nO3 = normalize(c, 280, 320)

        const combined = 0.5 * nNo2 + 0.3 * nHcho + 0.2 * nO3
        scores[i / 12] = Math.round(combined * 100)
    }

    const png = new PNG({ width: 256, height: 256 })

    for (let i = 0; i < scores.length; i++) {
        const score = scores[i] // 0..100
        const o = i * 4

        // normalize and apply a cutoff so very low scores are fully invisible
        const tRaw = Math.max(0, Math.min(1, score / 100)) // 0..1 over full range
        const cutoff = 0.5 // invisible until 25%
        const t = tRaw <= cutoff ? 0 : (tRaw - cutoff) / (1 - cutoff) // remap to 0..1

        // smooth ramp so mid/high stand out more
        const ease = t * t * (3 - 2 * t) // smoothstep

        // lighten → darken brown as opacity increases
        // lightBrown = #B3874A (179,135,74), darkBrown = #3A2A00 (58,42,0)
        const lr = 179,
            lg = 135,
            lb = 74
        const dr = 58,
            dg = 42,
            db = 0
        const r = Math.round(lr + (dr - lr) * ease)
        const g = Math.round(lg + (dg - lg) * ease)
        const b = Math.round(lb + (db - lb) * ease)

        // alpha: jump to a visible floor, then ramp to 10
        const alphaFloor = 2 // small but noticeable
        const a = t === 0 ? 0 : alphaFloor + Math.round((20 - alphaFloor) * ease)

        png.data[o] = r
        png.data[o + 1] = g
        png.data[o + 2] = b
        png.data[o + 3] = a
    }

    console.log(stats)
    return PNG.sync.write(png)
}
