import { Source, Tiff, TiffImage } from "@cogeotiff/core"
import { lzwDecoder } from "./lzw.js"

const EARTH_CIRCUMFERENCE = 40075016.68557849
const EARTH_HALF_CIRCUMFERENCE = EARTH_CIRCUMFERENCE / 2

function getResolutionFromZoomLevel(z: number) {
    return EARTH_CIRCUMFERENCE / 256 / 2 ** z
}

function getZoomLevelFromResolution(resolution: number) {
    return Math.round(Math.log2(EARTH_CIRCUMFERENCE / (resolution * 256)))
}
function getZoomRange(cog: Tiff) {
    const img = cog.images[cog.images.length - 1]

    const minZoom = getZoomLevelFromResolution(img.resolution[0])
    const maxZoom = minZoom + (cog.images.length - 1)

    return [minZoom, maxZoom]
}
function getImageTileIndex(img: TiffImage) {
    const ax = EARTH_HALF_CIRCUMFERENCE + img.origin[0]
    const ay = -(EARTH_HALF_CIRCUMFERENCE + (img.origin[1] - EARTH_CIRCUMFERENCE))

    const mpt =
        img.tileSize.width *
        getResolutionFromZoomLevel(getZoomLevelFromResolution(img.resolution[0]))

    const ox = Math.round(ax / mpt)
    const oy = Math.round(ay / mpt)
    const oz = getZoomLevelFromResolution(img.resolution[0])

    return [ox, oy, oz]
}
export const getTileFromCogSource = async (source: Source, x: number, y: number, z: number) => {
    const tiff = await Tiff.create(source)
    const img = tiff.getImageByResolution(getResolutionFromZoomLevel(z))
    const zoomRange = getZoomRange(tiff)
    const lowestOriginTileOffset = getImageTileIndex(tiff.images[tiff.images.length - 1])

    let offset: number[] = [0, 0]

    if (z === zoomRange[0]) {
        offset = lowestOriginTileOffset
    } else {
        const power = 2 ** (z - zoomRange[0])
        offset[0] = Math.floor(lowestOriginTileOffset[0] * power)
        offset[1] = Math.floor(lowestOriginTileOffset[1] * power)
    }
    const tilesX = img.tileCount.x
    const tilesY = img.tileCount.y
    const ox = offset[0]
    const oy = offset[1]
    if (x - ox >= 0 && y - oy >= 0 && x - ox < tilesX && y - oy < tilesY) {
        const tile = await img.getTile(x - ox, y - oy)
        switch (img.compression) {
            case "application/lzw": {
                const decoded = lzwDecoder.decodeBlock(tile!.bytes)
                const decompressedFormatted = new Uint8Array(decoded)
                return decompressedFormatted
            }
            default:
                throw new Error(`Unknown img compression ${img.compression}`)
        }
    } else {
        return undefined
    }
}
