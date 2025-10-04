import Map from "react-map-gl/maplibre"

export const MapView = () => {
    return (
        <div className="relative w-full h-full">
            <Map
                // initialViewState={{
                //     longitude: -80,
                //     latitude: 49,
                //     zoom: 3,
                // }}
                style={{ width: "100%", height: "100vh" }}
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
            ></Map>
        </div>
    )
}
