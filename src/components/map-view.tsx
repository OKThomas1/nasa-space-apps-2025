import Map from "react-map-gl/maplibre"
import { useLayers } from "../hooks/useLayers"
import { DeckGLOverlay } from "./DeckglOverlay"

export const MapView = () => {
    const layers = useLayers()
    return (
        <div className="relative w-full h-full">
            <Map
                // initialViewState={{
                //     longitude: -80,
                //     latitude: 49,
                //     zoom: 3,
                // }}
                initialViewState={{
                    zoom: 11,
                    longitude: -123.236,
                    latitude: 48.43,
                }}
                maxZoom={20}
                minZoom={9}
                style={{ width: "100%", height: "100vh" }}
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
            >
                {" "}
                <DeckGLOverlay interleaved={true} layers={layers} />
            </Map>
        </div>
    )
}
