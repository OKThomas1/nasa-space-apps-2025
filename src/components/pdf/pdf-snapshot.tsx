import { Button } from "@mui/material"
import { useMap } from "react-map-gl/maplibre"
import { ThinkingDialog } from "./dialog"
import { takeMapScreenshot } from "./module"
import { PDFAnnotations } from "./pdf-annotations"
import { useActionableGenerator } from "./useActionableGenerator"

export const PDFSnapshot = ({ onBlur }: { onBlur: () => void }) => {
    const { map } = useMap()
    const { generateActionables, actionables, thinkingStep, loading } = useActionableGenerator()

    if (!map) throw new Error("Map instance is required")

    return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-3/7 pointer-events-none">
            <div className="-mt-16 flex gap-2 justify-end mb-2">
                <Button className="pointer-events-auto" onClick={onBlur}>
                    Cancel
                </Button>

                <Button
                    id="btn-ai-actions"
                    variant="outlined"
                    onClick={generateActionables}
                    className="pointer-events-auto w-24"
                >
                    Use AI
                </Button>

                <Button
                    variant="contained"
                    className="pointer-events-auto"
                    onClick={() => takeMapScreenshot(map)}
                >
                    Export
                </Button>
            </div>

            <div
                id="pdf-frame"
                className="border border-white pointer-events-none relative"
                style={{ aspectRatio: "11 / 8.5", width: "clamp(40rem, 80vh, 90vw)" }}
            >
                <PDFAnnotations
                    actionables={actionables}
                    className="pointer-events-none absolute top-0 right-0 bottom-0"
                    style={{ width: "clamp(10rem, 25%, 16rem)" }}
                />
            </div>

            <ThinkingDialog open={loading} thinkingStep={thinkingStep} />
        </div>
    )
}
