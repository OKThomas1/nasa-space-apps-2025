import type { GeoBoundingBox } from "@deck.gl/geo-layers"
import { parse } from "@loaders.gl/core"
import { BitmapLayer, TileLayer } from "deck.gl"
import type { Placeable } from "../PlacaebleContext"
import { calculatePollutionScore } from "../util/pollutionScore"

// const cache = new Map<string, DataView<ArrayBuffer>>()

const getTime = (time: number) => {
    if (time === 0) throw new Error("Invalid time")
    if (time === 2) return "1738368000000"
    if (time === 3) return "1748736000000"
    else return "1757353599000"
}

export const pollutionLayer = ({
    factories,
    cars,
    opacity,
    threshold,
    trees,
    time,
    showWeather = false,
}: {
    opacity: number
    cars: number
    threshold: number
    trees: Placeable[]
    factories: Placeable[]
    time: number
    showWeather?: boolean
}) => {
    return new TileLayer({
        id: "pollution-tile-layer",
        minZoom: 9,
        maxZoom: 14,
        tileSize: 256,
        refinementStrategy: "no-overlap",
        maxCacheSize: Infinity,
        updateTriggers: {
            getTileData: [trees.length, factories.length, cars, time, showWeather, threshold],
        },

        getTileData: async (tile) => {
            const { x, y, z } = tile.index
            // const key = `${x}-${y}-${z}`

            // let raster: DataView<ArrayBuffer>
            // if (cache.has(key)) {
            //     raster = cache.get(key)!
            // } else {
            //     const tempoResponse = await fetch(`http://10.16.10.139:3000/tempo/${x}/${y}/${z}`)
            //     const buffer = await tempoResponse.arrayBuffer()
            //     raster = new DataView(buffer)
            //     cache.set(key, raster)
            // }

            let params = ""
            if (time) params += "?time=" + getTime(time)

            const { signal } = tile
            const promises = [
                fetch(
                    `https://bin-obtained-subsidiary-notification.trycloudflare.com/tempo/${x}/${y}/${z}${params}`,
                    {
                        signal,
                        headers: { "ngrok-skip-browser-warning": "true" },
                    }
                ),
            ]
            if (showWeather) {
                promises.push(
                    fetch(
                        `https://bin-obtained-subsidiary-notification.trycloudflare.com/weather/${x}/${y}/${z}`,
                        {
                            signal,
                        }
                    )
                )
            }
            const responses = await Promise.all(promises)
            const tempoResponse = responses[0]
            const weatherBuffer = showWeather
                ? new Uint8Array(await responses[1].arrayBuffer())
                : undefined

            const tempoBuffer = await tempoResponse.arrayBuffer()
            const dv = new DataView(tempoBuffer)

            const carMultiplier = 1 + ((cars - 25) / 25) * 0.24

            const b = new Blob([
                Buffer.from(
                    calculatePollutionScore(
                        dv,
                        carMultiplier,
                        trees,
                        threshold,
                        factories,
                        tile.bbox as GeoBoundingBox,
                        tile.zoom ?? 0,
                        weatherBuffer
                    )
                ),
            ])

            const image = b.slice(0, b.size, "image/png")
            return await parse(image)
        },
        renderSubLayers: (props) => {
            const { bbox, index, data } = props.tile
            const { west, south, east, north } = bbox as {
                west: number
                north: number
                east: number
                south: number
            }
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
