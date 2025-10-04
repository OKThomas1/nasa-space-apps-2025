import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { FiltersProvider } from "./FiltersContext.tsx"
import "./index.css"
import { PlaceableProvider } from "./PlacaebleContext.tsx"
import { TimeProvider } from "./time/TimeContext.tsx"
import { ToolProvider } from "./ToolContext.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToolProvider>
            <TimeProvider>
                <FiltersProvider>
                    <PlaceableProvider>
                        <App />
                    </PlaceableProvider>
                </FiltersProvider>
            </TimeProvider>
        </ToolProvider>
    </StrictMode>
)
