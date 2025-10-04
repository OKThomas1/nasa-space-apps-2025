import { Marker } from "react-map-gl/maplibre"
import { usePlaceableContext } from "./PlacaebleContext"

const PlaceableLayer = () => {
    const { items } = usePlaceableContext()

    return items.map((placeable) => (
        <Marker latitude={placeable.position.lat} longitude={placeable.position.lng}>
            {placeable.icon}
        </Marker>
    ))
}

export { PlaceableLayer }
