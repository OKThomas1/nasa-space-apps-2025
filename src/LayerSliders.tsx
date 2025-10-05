import Slider from "@mui/material/Slider"
import type { ReactNode } from "react"

const buildSlider = ({ layer, min, max, step, icon }: LayerSlider): LayerSlider => ({
    layer,
    min,
    max,
    step,
    icon,
})

export interface LayerSlider {
    layer: string
    min: number
    max: number
    step: number
    icon: ReactNode
}

const LayerSlidersMap: Record<LayerSlider["layer"], LayerSlider> = {
    pollution: buildSlider({ layer: "pollution", min: 0, max: 50, step: 1, icon: <Slider /> }),
    cars: buildSlider({ layer: "cars", min: 0, max: 50, step: 1, icon: <Slider /> }),
}

const LayerSlidersList = Object.values(LayerSlidersMap)

export { LayerSlidersList, LayerSlidersMap }
