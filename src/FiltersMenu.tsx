import Slider from "@mui/material/Slider"
import Switch from "@mui/material/Switch"
import { type FunctionComponent } from "react"
import { useFiltersContext } from "./FiltersContext"
import { LayerSlidersList } from "./LayerSliders"

export const FiltersMenu: FunctionComponent = () => {
    const { sliderValues, setSliderValues, iconToggles, setIconToggles } = useFiltersContext()

    const handleChange = (index: number, newValue: number) => {
        const updated = [...sliderValues]
        updated[index] = newValue
        setSliderValues(updated)
    }

    const handleToggleChange = (index: number, checked: boolean) => {
        const updated = [...iconToggles]
        updated[index] = checked
        setIconToggles(updated)
    }

    return (
        <div className="flex flex-col gap-3 items-center bg-zinc-700 p-4 rounded-lg w-fit text-center">
            <h3 className="text-lg font-medium text-gray-200">Layer Opacity Controls</h3>

            <div className="flex flex-col flex-wrap items-center gap-6">
                {LayerSlidersList.map((layer, index) => (
                    <div key={layer.layer} className="flex flex-col items-center w-full">
                        <small className="font-medium capitalize">{layer.layer}</small>
                        <Slider
                            value={sliderValues[index]}
                            min={layer.min}
                            max={layer.max}
                            step={layer.step}
                            onChange={(_, value) => handleChange(index, value as number)}
                            valueLabelDisplay="auto"
                            sx={{ width: 120 }}
                        />
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-800 w-full"></div>
            <h3 className="text-xl font-semibold text-gray-800">Icon Toggles</h3>
            <div className="flex flex-col flex-wrap items-center gap-2">
                {["Trees", "Factories"].map((name, index) => (
                    <div key={name} className="flex flex-col items-center w-[130px]">
                        <small className="font-medium capitalize">{name}</small>
                        <Switch
                            checked={iconToggles[index] ?? true} // read current state
                            onChange={(_, checked) => handleToggleChange(index, checked)} // update context
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
