import Map from "react-map-gl/maplibre"

export const MapView = () => {
    return (
        <div className="relative w-full h-full overflow-hidden">
            <Map
                id="map"
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                preserveDrawingBuffer={true}
            ></Map>
        </div>
    )
}
