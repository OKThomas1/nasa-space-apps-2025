import { createTheme, ThemeProvider } from "@mui/material"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { FiltersProvider } from "./FiltersContext.tsx"
import "./index.css"
import { PlaceableProvider } from "./PlacaebleContext.tsx"
import { TimeProvider } from "./time/TimeContext.tsx"
import { ToolProvider } from "./ToolContext.tsx"

const theme = createTheme({
    palette: {
        background: {
            default: "#303030",
            paper: "#303030",
        },
    },
})

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToolProvider>
            <TimeProvider>
                <FiltersProvider>
                    <PlaceableProvider>
                        <ThemeProvider theme={theme}>
                            <App />
                        </ThemeProvider>
                    </PlaceableProvider>
                </FiltersProvider>
            </TimeProvider>
        </ToolProvider>
    </StrictMode>
)
