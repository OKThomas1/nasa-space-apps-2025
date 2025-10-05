import type { GeoBoundingBox } from "@deck.gl/geo-layers"
import { PNG } from "pngjs"
import type { Placeable } from "../PlacaebleContext"

function normalize(x: number, low: number, high: number): number {
    if (x < 0) return 0
    return Math.max(0, Math.min(1, (x - low) / (high - low)))
}

// --- TREE CONSTANTS ---
const TREE_UNIT_POWER = 1.0
const NO2_REDUCTION_PER_UNIT = 0.05 * TREE_UNIT_POWER
const HCHO_REDUCTION_PER_UNIT = 0.03 * TREE_UNIT_POWER
const O3_REDUCTION_PER_UNIT = 0.02 * TREE_UNIT_POWER

// --- FACTORY CONSTANTS (using the absolute addition model) ---
const FACTORY_NO2_ADDITION = 2e15
const FACTORY_HCHO_ADDITION = 5e14
const FACTORY_O3_EFFECT = -5e14

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

    const realWorldRadius = 564
    const pixelRadius = Math.ceil(realWorldRadius / metersPerPixel)
    // --- OPTIMIZATION: Pre-calculate squared radius ---
    const pixelRadiusSquared = pixelRadius * pixelRadius

    // --- OPTIMIZATION: Create a Falloff Lookup Table (LUT) ---
    const falloffLUT = new Float32Array(pixelRadiusSquared + 1)
    for (let i = 0; i <= pixelRadiusSquared; i++) {
        const distance = Math.sqrt(i)
        const falloff = 1 - distance / pixelRadius
        falloffLUT[i] = falloff * falloff // Quadratic falloff
    }

    for (const tree of trees) {
        const pixelX = Math.floor(((tree.position.lng - west) / (east - west)) * width)
        const pixelY = Math.floor(((north - tree.position.lat) / (north - south)) * height)

        for (let dx = -pixelRadius; dx <= pixelRadius; dx++) {
            for (let dy = -pixelRadius; dy <= pixelRadius; dy++) {
                const distanceSquared = dx * dx + dy * dy

                // --- OPTIMIZATION: Use squared distance check ---
                if (distanceSquared > pixelRadiusSquared) {
                    continue
                }

                const currentX = pixelX + dx
                const currentY = pixelY + dy

                if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
                    // --- OPTIMIZATION: Get falloff from LUT ---
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

    const realWorldRadius = 1500
    const pixelRadius = Math.ceil(realWorldRadius / metersPerPixel)
    // --- OPTIMIZATION: Pre-calculate squared radius ---
    const pixelRadiusSquared = pixelRadius * pixelRadius

    // --- OPTIMIZATION: Create a Falloff Lookup Table (LUT) ---
    const falloffLUT = new Float32Array(pixelRadiusSquared + 1)
    for (let i = 0; i <= pixelRadiusSquared; i++) {
        const distance = Math.sqrt(i)
        const falloff = 1 - distance / pixelRadius
        falloffLUT[i] = falloff * falloff // Quadratic falloff
    }

    for (const factory of factories) {
        const pixelX = Math.floor(((factory.position.lng - west) / (east - west)) * width)
        const pixelY = Math.floor(((north - factory.position.lat) / (north - south)) * height)

        for (let dx = -pixelRadius; dx <= pixelRadius; dx++) {
            for (let dy = -pixelRadius; dy <= pixelRadius; dy++) {
                const distanceSquared = dx * dx + dy * dy

                // --- OPTIMIZATION: Use squared distance check ---
                if (distanceSquared > pixelRadiusSquared) {
                    continue
                }

                const currentX = pixelX + dx
                const currentY = pixelY + dy

                if (currentX >= 0 && currentX < width && currentY >= 0 && currentY < height) {
                    // --- OPTIMIZATION: Get falloff from LUT ---
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

export const calculatePollutionScore = (
    tempoBuffer: DataView,
    carMultiplier: number,
    trees: Placeable[],
    factories: Placeable[],
    bbox: GeoBoundingBox,
    zoom: number
) => {
    // --- THIS SECTION IS UNCHANGED, AS THE BOTTLENECK WAS IN THE HELPER FUNCTIONS ---

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

        const width = 256
        const height = 256
        const score = new Uint32Array(width * height)

        // The slow part is creating the maps, which is now optimized.
        const reductionMap = createReductionMap(width, height, trees, bbox, zoom)
        const sourceMap = createPollutionSourceMap(width, height, factories, bbox, zoom)

        for (let i = 0; i < tempoBuffer.byteLength; i += 12) {
            const pixelIndex = i / 12

            const a_base = tempoBuffer.getFloat32(i, true)
            const b_base = tempoBuffer.getFloat32(i + 4, true)
            const c_base = tempoBuffer.getFloat32(i + 8, true)

            const effectIndex = pixelIndex * 3

            // Using the absolute addition model for factories
            const a_reduced = a_base * (1 - reductionMap[effectIndex])
            const b_reduced = b_base * (1 - reductionMap[effectIndex + 1])
            const c_reduced = c_base * (1 - reductionMap[effectIndex + 2])

            const a_final = a_reduced + sourceMap[effectIndex]
            const b_final = b_reduced + sourceMap[effectIndex + 1]
            const c_final = c_reduced + sourceMap[effectIndex + 2]

            const a = Math.max(0, a_final)
            const b = Math.max(0, b_final)
            const c = Math.max(0, c_final)

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
}
