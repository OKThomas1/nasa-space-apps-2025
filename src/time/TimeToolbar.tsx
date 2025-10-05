import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormLabel from "@mui/material/FormLabel"
import Slider from "@mui/material/Slider"
import { useState } from "react"
import { useFiltersContext } from "../FiltersContext"
import { useTimeContext } from "./TimeContext"

const marks = [
    { value: 4, label: "Current" },
    { value: 3, label: "June 25" },
    { value: 2, label: "Feb 25" },
]

const TimeToolbar = () => {
    const [sliderTime, setSliderTime] = useState(4)
    const [aggregateChecked, setAggregateChecked] = useState(true)
    const { setTime } = useTimeContext()
    const { setWeatherEnabled, weatherEnabled } = useFiltersContext()
    const _setTime = (time: number) => {
        setSliderTime(time)
        setTime(time)
    }
    return (
        <div className="flex flex-col h-full min-w-[300px] bg-gray-100 px-8 py-2 rounded-lg justify-center">
            <div className="flex">
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={aggregateChecked}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setTime(0)
                                } else {
                                    setTime(sliderTime)
                                }
                                setAggregateChecked(e.target.checked)
                            }}
                        />
                    }
                    label="Use Aggregate"
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={weatherEnabled}
                            onChange={(e) => {
                                setWeatherEnabled(e.target.checked)
                            }}
                        />
                    }
                    label="Weather"
                />
            </div>
            <FormLabel>Time</FormLabel>
            <Slider
                className=""
                marks={marks}
                min={2}
                max={4}
                disabled={aggregateChecked}
                step={1}
                value={sliderTime}
                valueLabelDisplay="auto"
                onChange={(_, v) => _setTime(v)}
            />
        </div>
    )
}

export { TimeToolbar }
