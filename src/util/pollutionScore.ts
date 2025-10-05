import type { GeoBoundingBox } from "@deck.gl/geo-layers"
import { PNG } from "pngjs"
import type { Placeable } from "../PlacaebleContext"
import { ToolsMap } from "../Tools"

function normalize(x: number, low: number, high: number): number {
    if (x < 0) return 0
    return Math.max(0, Math.min(1, (x - low) / (high - low)))
}

const TREE_UNIT_POWER = 5.0
const NO2_REDUCTION_PER_UNIT = 0.05 * TREE_UNIT_POWER
const HCHO_REDUCTION_PER_UNIT = 0.03 * TREE_UNIT_POWER
const O3_REDUCTION_PER_UNIT = 0.02 * TREE_UNIT_POWER

const FACTORY_NO2_ADDITION = 3e15
const FACTORY_HCHO_ADDITION = 7.5e14
const FACTORY_O3_EFFECT = 0

const createReductionMap = (
    width: number,
    height: number,
    trees: Placeable[],
    bbox: GeoBoundingBox,
    zoom: number
) => {
    const reductionMap = new Float32Array(width * height * 3)
    const { west, south, east, north } = bbox

    const middleLatitude = (north + south) / 2
    const earthCircumference = 40075017
    const metersPerPixel =
        (earthCircumference * Math.cos(middleLatitude * (Math.PI / 180))) / Math.pow(2, zoom + 8)

    const realWorldRadius = ToolsMap.tree.radius
    const pixelRadius = Math.ceil(realWorldRadius / metersPerPixel)
    const pixelRadiusSquared = pixelRadius * pixelRadius

    const falloffLUT = new Float32Array(pixelRadiusSquared + 1)
    for (let i = 0; i <= pixelRadiusSquared; i++) {
        const distance = Math.sqrt(i)
        const falloff = 1 - distance / pixelRadius
        falloffLUT[i] = falloff
    }

    for (const tree of trees) {
        const pixelX = Math.floor(((tree.position.lng - west) / (east - west)) * width)
        const pixelY = Math.floor(((north - tree.position.lat) / (north - south)) * height)

        for (let dx = -pixelRadius; dx <= pixelRadius; dx++) {
            for (let dy = -pixelRadius; dy <= pixelRadius; dy++) {
                const distanceSquared = dx * dx + dy * dy

                if (distanceSquared > pixelRadiusSquared) {
                    continue
                }

                const currentX = pixelX + dx
                const currentY = pixelY + dy

                if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
                    const falloff = falloffLUT[distanceSquared]
                    const index = (currentY * width + currentX) * 3

                    reductionMap[index] = Math.min(
                        0.95,
                        reductionMap[index] + NO2_REDUCTION_PER_UNIT * falloff
                    )
                    reductionMap[index + 1] = Math.min(
                        0.95,
                        reductionMap[index + 1] + HCHO_REDUCTION_PER_UNIT * falloff
                    )
                    reductionMap[index + 2] = Math.min(
                        0.95,
                        reductionMap[index + 2] + O3_REDUCTION_PER_UNIT * falloff
                    )
                }
            }
        }
    }
    return reductionMap
}

const createPollutionSourceMap = (
    width: number,
    height: number,
    factories: Placeable[],
    bbox: GeoBoundingBox,
    zoom: number
) => {
    const sourceMap = new Float32Array(width * height * 3)
    const { west, south, east, north } = bbox

    const middleLatitude = (north + south) / 2
    const earthCircumference = 40075017
    const metersPerPixel =
        (earthCircumference * Math.cos(middleLatitude * (Math.PI / 180))) / Math.pow(2, zoom + 8)

    const realWorldRadius = ToolsMap.factory.radius
    const pixelRadius = Math.ceil(realWorldRadius / metersPerPixel)
    const pixelRadiusSquared = pixelRadius * pixelRadius

    const falloffLUT = new Float32Array(pixelRadiusSquared + 1)
    for (let i = 0; i <= pixelRadiusSquared; i++) {
        const distance = Math.sqrt(i)
        const falloff = 1 - distance / pixelRadius
        falloffLUT[i] = falloff * falloff
    }

    for (const factory of factories) {
        const pixelX = Math.round(((factory.position.lng - west) / (east - west)) * width)
        const pixelY = Math.round(((north - factory.position.lat) / (north - south)) * height)

        for (let dx = -pixelRadius; dx <= pixelRadius; dx++) {
            for (let dy = -pixelRadius; dy <= pixelRadius; dy++) {
                const distanceSquared = dx * dx + dy * dy

                if (distanceSquared > pixelRadiusSquared) {
                    continue
                }

                const currentX = pixelX + dx
                const currentY = pixelY + dy

                if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
                    const falloff = falloffLUT[distanceSquared]
                    const index = (currentY * width + currentX) * 3

                    sourceMap[index] += FACTORY_NO2_ADDITION * falloff
                    sourceMap[index + 1] += FACTORY_HCHO_ADDITION * falloff
                    sourceMap[index + 2] += FACTORY_O3_EFFECT * falloff
                }
            }
        }
    }
    return sourceMap
}

const CAR_IMPACT_ON_NO2 = 1.0
const CAR_IMPACT_ON_O3 = 0.6
const CAR_IMPACT_ON_HCHO = 0.4

export const calculatePollutionScore = (
    tempoBuffer: DataView,
    carMultiplier: number,
    trees: Placeable[],
    threshhold: number,
    factories: Placeable[],
    bbox: GeoBoundingBox,
    zoom: number,
    weatherBuffer?: Uint8Array
) => {
    if (tempoBuffer.byteLength !== 4 * 3 * 256 * 256)
        throw new Error(
            "Expected buffer of length " +
                4 * 3 * 256 * 256 +
                " found length " +
                tempoBuffer.byteLength
        )

    if (weatherBuffer && weatherBuffer.length !== 2 * 256 * 256) {
        throw new Error(
            "Expected weather buffer of length " +
                2 * 256 * 256 +
                " found length " +
                tempoBuffer.byteLength
        )
    }

    const scores = new Uint8Array(256 * 256)
    const stats = Array.from({ length: 3 }).map(() => ({ min: Infinity, max: -Infinity, mean: 0 }))

    const width = 256
    const height = 256
    const reductionMap = createReductionMap(width, height, trees, bbox, zoom)
    const sourceMap = createPollutionSourceMap(width, height, factories, bbox, zoom)

    for (let i = 0; i < tempoBuffer.byteLength; i += 12) {
        for (let j = 0; j < 3; j++) {
            const num = tempoBuffer.getFloat32(i + j * 4, true)
            stats[j].min = Math.min(stats[j].min, num)
            stats[j].max = Math.max(stats[j].max, num)
            stats[j].mean += num / (256 * 256)
        }

        const pixelIndex = i / 12

        const a_base = tempoBuffer.getFloat32(i, true)
        const b_base = tempoBuffer.getFloat32(i + 4, true)
        const c_base = tempoBuffer.getFloat32(i + 8, true)

        const effectIndex = pixelIndex * 3

        const a_reduced = a_base * (1 - reductionMap[effectIndex])
        const b_reduced = b_base * (1 - reductionMap[effectIndex + 1])
        const c_reduced = c_base * (1 - reductionMap[effectIndex + 2])

        const a_final = a_reduced + sourceMap[effectIndex]
        const b_final = b_reduced + sourceMap[effectIndex + 1]
        const c_final = c_reduced + sourceMap[effectIndex + 2]

        const a = Math.max(0, a_final)
        const b = Math.max(0, b_final)
        const c = Math.max(0, c_final)

        const base_nNo2 = normalize(a, 1e15, 5e15)
        const base_nHcho = normalize(b, 5e15, 2e16)
        const base_nO3 = normalize(c, 280, 320)

        const carEffect = carMultiplier - 1

        const nNo2 = base_nNo2 * (1 + carEffect * CAR_IMPACT_ON_NO2)
        const nHcho = base_nHcho * (1 + carEffect * CAR_IMPACT_ON_HCHO)
        const nO3 = base_nO3 * (1 + carEffect * CAR_IMPACT_ON_O3)

        scores[i / 12] = weatherBuffer
            ? pollutionScore(nNo2, nHcho, nO3, weatherBuffer[i / 12], weatherBuffer[i / 12 + 1])
            : Math.round((0.45 * nNo2 + 0.45 * nHcho + 0.1 * nO3) * 100)
    }

    const png = new PNG({ width: 256, height: 256 })

    for (let i = 0; i < scores.length; i++) {
        const score = scores[i] // 0..100
        const o = i * 4

        // normalize and apply a cutoff so very low scores are fully invisible
        const tRaw = Math.max(0, Math.min(1, score / 100)) // 0..1 over full range
        const t = tRaw <= threshhold ? 0 : (tRaw - threshhold) / (1 - threshhold) // remap to 0..1

        const ease = t * t * (3 - 2 * t)

        const lr = 179,
            lg = 135,
            lb = 74
        const dr = 58,
            dg = 42,
            db = 0
        const r = Math.round(lr + (dr - lr) * ease)
        const g = Math.round(lg + (dg - lg) * ease)
        const b = Math.round(lb + (db - lb) * ease)

        const alphaFloor = 2
        const a = t === 0 ? 0 : alphaFloor + Math.round((20 - alphaFloor) * ease)

        png.data[o] = r
        png.data[o + 1] = g
        png.data[o + 2] = b
        png.data[o + 3] = a
    }

    return PNG.sync.write(png)
}

function pollutionScore(
    nNo2: number,
    nHcho: number,
    nO3: number,
    wind: number,
    rain: number
): number {
    const pW = wind / 100
    const pR = rain / 100

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dispersion = Math.exp(-1.2 * pW - 0.8 * pR) / ((window as any).weatherMult || 1)

    const sNo2 = Math.exp(-0.6 * pR)
    const sHcho = Math.exp(-1.0 * pR)
    const sO3 = Math.exp(-0.3 * pR)

    const wNo2 = 0.45
    const wHcho = 0.45
    const wO3 = 0.1

    const adjNo2 = nNo2 * sNo2 * dispersion
    const adjHcho = nHcho * sHcho * dispersion
    const adjO3 = nO3 * sO3 * dispersion

    const weighted = wNo2 * adjNo2 + wHcho * adjHcho + wO3 * adjO3
    return Math.round(weighted * 100)
}
