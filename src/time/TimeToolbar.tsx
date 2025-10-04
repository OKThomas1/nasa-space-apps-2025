import FormLabel from "@mui/material/FormLabel"
import Slider from "@mui/material/Slider"
import { useTimeContext } from "./TimeContext"

const TimeToolbar = () => {
    const { time, setTime } = useTimeContext()
    return (
        <div className="flex flex-col h-full min-w-64 bg-gray-100 px-3 py-2 rounded-lg justify-center">
            <FormLabel>Time</FormLabel>
            <Slider valueLabelDisplay="auto" value={time ?? 100} onChange={(_, v) => setTime(v)} />
        </div>
    )
}

export { TimeToolbar }
