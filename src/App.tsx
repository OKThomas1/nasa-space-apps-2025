import { Button } from "@mui/material"
import { useState } from "react"
import { MapProvider } from "react-map-gl/maplibre"
import { MapView } from "./components/map-view"
import { PDFSnapshot } from "./components/pdf/pdf-snapshot"
import { FiltersMenu } from "./FiltersMenu"
import { Legend } from "./legend/Legend"
import { TimeToolbar } from "./time/TimeToolbar"
import { ToolBar } from "./ToolBar"

function App() {
    const [snapshotIsOpen, setSnapshotIsOpen] = useState(false)

    return (
        <MapProvider>
            <div className="relative h-screen w-screen">
                <MapView />

                {/* Bottom Bar */}
                <div className="absolute flex gap-4 bottom-4 w-full max-h-32 h-full justify-center pointer-events-none [&>*]:pointer-events-auto">
                    <ToolBar />
                    <TimeToolbar />

                    <Button
                        variant={snapshotIsOpen ? "contained" : "outlined"}
                        onClick={() => setSnapshotIsOpen((prev) => !prev)}
                    >
                        Toggle PDF
                    </Button>
                </div>

                {/* Right Bar */}
                <div className="absolute flex flex-col justify-center right-4 bottom-0 h-full max-w-32 w-full pointer-events-none [&>*]:pointer-events-auto">
                    <Legend />
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
