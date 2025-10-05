import type { GeoBoundingBox } from "@deck.gl/geo-layers"
import { parse } from "@loaders.gl/core"
import { BitmapLayer, TileLayer } from "deck.gl"
import type { Placeable } from "../PlacaebleContext"
import { calculatePollutionScore } from "../util/pollutionScore"

export const pollutionLayer = (opacity: number, trees: Placeable[], factories: Placeable[]) => {
    console.log("Factories received in calculation:", factories)

    return new TileLayer({
        id: "pollution-tile-layer",
        minZoom: 9,
        maxZoom: 14,
        tileSize: 256,
        updateTriggers: {
            getTileData: [trees.length, factories.length],
        },

        getTileData: async (tile) => {
            const { x, y, z } = tile.index

            const tempoResponse = await fetch(`http://10.16.10.139:3000/tempo/${x}/${y}/${z}`)
            const buffer = await tempoResponse.arrayBuffer()
            const raster = new DataView(buffer)

            const b = new Blob([
                Buffer.from(
                    calculatePollutionScore(
                        raster,
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
