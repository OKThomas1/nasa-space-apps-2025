import Slider from "@mui/material/Slider"
import type { ReactNode } from "react"

const buildSlider = ({ layer, min, max, step, icon, defaultValue }: LayerSlider): LayerSlider => ({
    layer,
    min,
    max,
    defaultValue,
    step,
    icon,
})

export interface LayerSlider {
    layer: string
    min: number
    max: number
    defaultValue?: number
    step: number
    icon: ReactNode
}

const LayerSlidersMap: Record<LayerSlider["layer"], LayerSlider> = {
    pollution: buildSlider({
        layer: "Pollution Opacity",
        min: 0,
        max: 100,
        step: 1,
        icon: <Slider />,
    }),
    cars: buildSlider({ layer: "cars", min: 0, max: 50, step: 1, icon: <Slider /> }),
    threshhold: buildSlider({
        icon: <Slider />,
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.2,
        layer: "Pollution Threshold",
    }),
}

const LayerSlidersList = Object.values(LayerSlidersMap)

export { LayerSlidersList, LayerSlidersMap }
