import { Button } from "@mui/material"
import { useMap } from "react-map-gl/maplibre"
import { takeMapScreenshot } from "./module"
import { PDFAnnotations } from "./pdf-annotations"

export const PDFSnapshot = () => {
    const { map } = useMap()

    if (!map) throw new Error("Map instance is required")

    return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div
                id="pdf-frame"
                className="border border-white pointer-events-none relative"
                style={{ aspectRatio: "11 / 8.5", width: "clamp(40rem, 80vh, 90vw)" }}
            >
                <PDFAnnotations
                    className="pointer-events-none absolute top-0 right-0 bottom-0"
                    style={{ width: "clamp(10rem, 25%, 16rem)" }}
                />
            </div>

            <Button
                className="pointer-events-auto left-1/2 -translate-x-1/2"
                onClick={() => takeMapScreenshot(map)}
            >
                Export
            </Button>
        </div>
    )
}
