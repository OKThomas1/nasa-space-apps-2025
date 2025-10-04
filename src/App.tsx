import "./App.css"
import { MapView } from "./components/map-view"
import { Legend } from "./legend/Legend"
import { TimeToolbar } from "./time/TimeToolbar"
import { ToolBar } from "./ToolBar"

function App() {
    return (
        <div className="relative h-screen w-screen">
            <MapView />

            {/* Bottom Bar */}
            <div className="absolute flex gap-4 bottom-4 w-full max-h-32 h-full justify-center pointer-events-none [&>*]:pointer-events-auto">
                <ToolBar />
                <TimeToolbar />
            </div>

            {/* Right Bar */}
            <div className="absolute flex flex-col justify-center right-4 bottom-0 h-full max-w-32 w-full pointer-events-none [&>*]:pointer-events-auto">
                <Legend />
            </div>
        </div>
    )
}

export default App
