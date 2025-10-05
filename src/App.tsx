import { Button } from "@mui/material"
import { useRef, useState } from "react"
import { MapProvider, type MapRef } from "react-map-gl/maplibre"
import { MapView } from "./components/map-view"
import { PDFSnapshot } from "./components/pdf/pdf-snapshot"
import { FiltersMenu } from "./FiltersMenu"
import { TimeToolbar } from "./time/TimeToolbar"
import { ToolBar } from "./ToolBar"
import { LatLngInput } from "./util/LatLngInput"

function App() {
    const [snapshotIsOpen, setSnapshotIsOpen] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const mapRef = useRef<MapRef>(null)

    return (
        <MapProvider>
            <div className="relative h-screen w-screen">
                <MapView onLoad={() => setMapLoaded(true)} ref={mapRef} />

                {/* Bottom Bar */}
                <div className="absolute flex gap-4 bottom-4 w-full max-h-32 h-full justify-center items-end pointer-events-none [&>*]:pointer-events-auto">
                    <ToolBar />
                    <TimeToolbar />

                    <div className="h-full">
                        <Button
                            sx={{ height: "100%" }}
                            variant={snapshotIsOpen ? "contained" : "outlined"}
                            onClick={() => setSnapshotIsOpen((prev) => !prev)}
                        >
                            Toggle PDF
                        </Button>
                    </div>
                </div>

                {/* Right Bar */}
                <div className="absolute flex flex-col justify-center right-4 bottom-0 h-full max-w-52 w-full pointer-events-none [&>*]:pointer-events-auto">
                    {mapLoaded && <LatLngInput getMapRef={() => mapRef.current!} />}
                </div>

                <div className="absolute flex flex-col justify-center left-4 bottom-0 h-full w-full pointer-events-none [&>*]:pointer-events-auto">
                    <FiltersMenu />
                </div>

                {/* PDF Snapshot */}
                {snapshotIsOpen && <PDFSnapshot />}
            </div>
        </MapProvider>
    )
}

export default App
