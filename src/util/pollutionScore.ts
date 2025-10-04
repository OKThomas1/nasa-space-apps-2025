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
    const score = new Uint32Array(256 * 256)
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
        score[i / 12] = Math.round(combined * 100)
    }

    const png = new PNG({ width: 256, height: 256 })

    for (let i = 0; i < score.length; i++) {
        let p = score[i]
        if (p < 50) {
            p /= 50
            png.data[i * 4] = 255 * p
            png.data[i * 4 + 1] = 255
            png.data[i * 4 + 2] = 0
            png.data[i * 4 + 3] = 255
        } else {
            p = (p - 50) / 50
            png.data[i * 4] = 255 * (1 - p)
            png.data[i * 4 + 1] = 255 * (1 - p)
            png.data[i * 4 + 2] = 0
            png.data[i * 4 + 3] = 255
        }
    }
    console.log(stats)
    return PNG.sync.write(png)
}
