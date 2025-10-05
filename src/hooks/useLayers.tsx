import { useFiltersContext } from "../FiltersContext"
import { pollutionLayer } from "../layers/pollution"
import { usePlaceableContext } from "../PlacaebleContext"
import { useTimeContext } from "../time/TimeContext"

export const useLayers = () => {
    const { sliderValues, weatherEnabled } = useFiltersContext()
    const { items } = usePlaceableContext()
    const { time } = useTimeContext()
    const trees = items.filter((item) => item.type === "tree")
    const factories = items.filter((item) => item.type === "factory")

    return [
        pollutionLayer({
            opacity: sliderValues[0],
            cars: sliderValues[1],
            trees,
            factories,
            time: time || 0,
            showWeather: weatherEnabled,
        }),
    ]
}
