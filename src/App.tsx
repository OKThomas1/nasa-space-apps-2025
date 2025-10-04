import "./App.css"
import { MapView } from "./components/map-view"
import { ToolBar } from "./ToolBar"

function App() {
    return (
        <div className="relative h-screen w-screen">
            <MapView />
            <div className="absolute z-10 top-0">
                <ToolBar />
            </div>
        </div>
    )
}

export default App
