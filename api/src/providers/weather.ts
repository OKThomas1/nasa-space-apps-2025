import { Request, Response } from "express"
import { mkdirSync } from "fs"
import fs from "fs/promises"
import { PNG } from "pngjs"
import { exists } from "../util/exists"

function rainScoreFromRGB(r: number, g: number, b: number, a: number): number {
    if (a === 0) return 0
    const colorStops = [
        { rgb: [0, 255, 255], mmh: 0.1 },
        { rgb: [0, 224, 255], mmh: 0.3 },
        { rgb: [0, 255, 0], mmh: 1 },
        { rgb: [0, 192, 0], mmh: 3 },
        { rgb: [0, 112, 0], mmh: 10 },
    ]

    let nearest = colorStops[0]
    let minDist = Infinity
    for (const stop of colorStops) {
        const [sr, sg, sb] = stop.rgb
        const d = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2
        if (d < minDist) {
            minDist = d
            nearest = stop
        }
    }

    const mmh = nearest.mmh
    return Math.round(Math.min(100, (mmh / 10) * 100))
}

const handler = async (req: Request, res: Response) => {
    const { x, y, z } = req.params
    const [rainBuffer, windBuffer] = await Promise.all([
        (async () => {
            if (await exists(`./data/rain/${z}/${x}/${y}.png`)) {
                return (await fs.readFile(
                    `./data/rain/${z}/${x}/${y}.png`
                )) as unknown as ArrayBuffer
            }
            mkdirSync(`./data/rain/${z}/${x}`, { recursive: true })
            const buffer = await fetch(
                `https://tile.openweathermap.org/map/precipitation_new/${z}/${x}/${y}?appid=${process.env["WEATHER_API_KEY"]}&day=2025-10-04T00:40`
            ).then((res) => res.arrayBuffer())
            await fs.writeFile(`./data/rain/${z}/${x}/${y}.png`, Buffer.from(buffer))
            return buffer
        })(),
        (async () => {
            if (await exists(`./data/wind/${z}/${x}/${y}.png`)) {
                return (await fs.readFile(
                    `./data/wind/${z}/${x}/${y}.png`
                )) as unknown as ArrayBuffer
            }
            mkdirSync(`./data/wind/${z}/${x}`, { recursive: true })
            const buffer = await fetch(
                `https://tile.openweathermap.org/map/wind_new/${z}/${x}/${y}?appid=90f50fddaed05721572338f7012f4455&day=2025-10-04T00:40`
            ).then((res) => res.arrayBuffer())
            await fs.writeFile(`./data/wind/${z}/${x}/${y}.png`, Buffer.from(buffer))
            return buffer
        })(),
    ])

    const rainData = PNG.sync.read(Buffer.from(rainBuffer))
    const windData = PNG.sync.read(Buffer.from(windBuffer))
    const output = new Uint8Array(256 * 256 * 2)
    for (let i = 0; i < 256 * 256 * 4; i += 4) {
        const rainScore = rainScoreFromRGB(
            rainData.data[i],
            rainData.data[i + 1],
            rainData.data[i + 2],
            rainData.data[i + 3]
        )
        const windScore = (windData.data[i + 3] / 255) * 100
        if (i < 10) console.log(rainScore, windScore)
        output[i / 4] = rainScore
        output[i / 4 + 1] = windScore
    }
    return res.end(output)
}

export default handler
