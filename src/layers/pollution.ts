import type { GeoBoundingBox } from "@deck.gl/geo-layers"
import { parse } from "@loaders.gl/core"
import { BitmapLayer, TileLayer } from "deck.gl"
import type { Placeable } from "../PlacaebleContext"
import { calculatePollutionScore } from "../util/pollutionScore"

const cache = new Map<string, DataView<ArrayBuffer>>()

export const pollutionLayer = ({
    factories,
    cars,
    opacity,
    trees,
}: {
    opacity: number
    cars: number
    trees: Placeable[]
    factories: Placeable[]
}) => {
    return new TileLayer({
        id: "pollution-tile-layer",
        minZoom: 9,
        maxZoom: 14,
        tileSize: 256,
        updateTriggers: {
            getTileData: [trees.length, factories.length, cars],
        },

        getTileData: async (tile) => {
            const { x, y, z } = tile.index
            const key = `${x}-${y}-${z}`

            let raster: DataView<ArrayBuffer>
            if (cache.has(key)) {
                raster = cache.get(key)!
            } else {
                const tempoResponse = await fetch(`http://10.16.10.139:3000/tempo/${x}/${y}/${z}`)
                const buffer = await tempoResponse.arrayBuffer()
                raster = new DataView(buffer)
                cache.set(key, raster)
            }

            const carMultipler = cars / 25

            const b = new Blob([
                Buffer.from(
                    calculatePollutionScore(
                        raster,
                        carMultipler,
                        trees,
                        factories,
                        tile.bbox as GeoBoundingBox,
                        tile.zoom ?? 0
                    )
                ),
            ])

            const image = b.slice(0, b.size, "image/png")
            // actually parse it to ImageData & return it
            return await parse(image)
        },
        renderSubLayers: (props) => {
            const { bbox, index, data } = props.tile
            const { west, south, east, north } = bbox
            const { x, y, z } = index

            return new BitmapLayer({
                id: `tile-${x}-${y}-${z}`,
                image: data,
                bounds: [west, south, east, north],
                opacity,
            })
        },
        opacity: opacity,
    })
}
