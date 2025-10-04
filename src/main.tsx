import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { FiltersProvider } from "./FiltersContext.tsx"
import "./index.css"
import { TimeProvider } from "./time/TimeContext.tsx"
import { ToolProvider } from "./ToolContext.tsx"

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToolProvider>
            <FiltersProvider>
                <TimeProvider>
                    <App />
                </TimeProvider>
            </FiltersProvider>
        </ToolProvider>
    </StrictMode>
)
