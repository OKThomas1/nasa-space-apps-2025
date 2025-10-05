import { useFiltersContext } from "../FiltersContext"
import { pollutionLayer } from "../layers/pollution"
import { usePlaceableContext } from "../PlacaebleContext"

export const useLayers = () => {
    const { sliderValues } = useFiltersContext()
    const { items } = usePlaceableContext()
    const trees = items.filter((item) => item.type === "tree")
    const factories = items.filter((item) => item.type === "factory")

    return [pollutionLayer(sliderValues[0] / 100, trees, factories)]
}
