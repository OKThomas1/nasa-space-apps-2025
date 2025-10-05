import "maplibre-gl/dist/maplibre-gl.css"
import Map from "react-map-gl/maplibre"
import { useLayers } from "../hooks/useLayers"
import { PlaceableBubbleLayer, PlaceableLayer } from "../PlaceableLayer"
import { ToolPlacementLayer } from "../ToolPlacementLayer"
import { DeckGLOverlay } from "./DeckglOverlay"

export const MapView = () => {
    const layers = useLayers()
    return (
        <div className="w-screen h-screen">
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
                id="map"
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                preserveDrawingBuffer={true}
            >
                <DeckGLOverlay interleaved={true} layers={layers} />

                <PlaceableLayer />
                <PlaceableBubbleLayer />
                <ToolPlacementLayer />
            </Map>
        </div>
    )
}
