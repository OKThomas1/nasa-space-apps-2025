import proj4 from "proj4"

export function toZoom9(x: number, y: number, z: number) {
    if (z === 9) return { x9: x, y9: y, z9: 9 }
    if (z > 9) {
        const f = 1 << (z - 9) // parent at z=9
        return { x9: Math.floor(x / f), y9: Math.floor(y / f), z9: 9 }
    } else {
        throw new Error("Cannot downscale")
    }
}

export function tileBBoxLonLat(x: number, y: number, z: number) {
    const n = 1 << z
    const lonW = (x / n) * 360 - 180
    const lonE = ((x + 1) / n) * 360 - 180

    const latN = rad2deg(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))))
    const latS = rad2deg(Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))))

    const [x1, y1] = proj4("EPSG:4326", "EPSG:3857", [lonW, latN])
    const [x2, y2] = proj4("EPSG:4326", "EPSG:3857", [lonE, latS])

    return { west: x1, south: y2, east: x2, north: y1 }
}
const rad2deg = (r: number) => (r * 180) / Math.PI
