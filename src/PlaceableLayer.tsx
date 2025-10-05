import { useMemo } from "react"
import { Layer, Marker, Source } from "react-map-gl/maplibre"
import { usePlaceableContext } from "./PlacaebleContext"

const PlaceableLayer = () => {
    const { items } = usePlaceableContext()

    return items.map((placeable) => (
        <Marker latitude={placeable.position.lat} longitude={placeable.position.lng}>
            {placeable.icon}
        </Marker>
    ))
}

const PlaceableBubbleLayer = () => {
    const { items } = usePlaceableContext()

    const geojson = useMemo(() => {
        if (!items || items.length === 0) return null

        const features = items.map((placeable) => {
            const center = [placeable.position.lng, placeable.position.lat]

            return createCirclePolygon(center, placeable.radius)
        })

        return {
            type: "FeatureCollection",
            features: features,
        }
    }, [items])

    if (!geojson) return null

    return (
        <Source id="placeable-bubble-source" type="geojson" data={geojson}>
            <Layer
                id="placeable-bubbles-outline"
                type="line"
                paint={{
                    "line-color": "#00000045",
                    "line-width": 2,
                }}
            />
        </Source>
    )
}

export { PlaceableBubbleLayer, PlaceableLayer }

function createCirclePolygon(center: number[], radiusInMeters: number, points = 64) {
    const [lng, lat] = center
    const coords = {
        latitude: lat,
        longitude: lng,
    }

    const km = radiusInMeters / 1000
    const ret = []
    const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180))
    const distanceY = km / 110.574

    let theta, x, y
    for (let i = 0; i < points; i++) {
        theta = (i / points) * (2 * Math.PI)
        x = distanceX * Math.cos(theta)
        y = distanceY * Math.sin(theta)
        ret.push([coords.longitude + x, coords.latitude + y])
    }
    ret.push(ret[0])

    return {
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [ret],
        },
        properties: {},
    }
}
