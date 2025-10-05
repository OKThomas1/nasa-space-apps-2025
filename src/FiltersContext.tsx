import {
    createContext,
    useContext,
    useMemo,
    useState,
    type FunctionComponent,
    type PropsWithChildren,
} from "react"
import { LayerSlidersList } from "./LayerSliders"

type FiltersContext = {
    sliderValues: number[]
    setSliderValues: (values: number[]) => void
    iconToggles: boolean[]
    setIconToggles: (visibility: boolean[]) => void
    weatherEnabled: boolean
    setWeatherEnabled: (b: boolean) => void
}

const FiltersContext = createContext<FiltersContext | undefined>(undefined)

export const FiltersProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const [sliderValues, setSliderValues] = useState<number[]>(
        LayerSlidersList.map((layer) => layer.defaultValue ?? (layer.max + layer.min) / 2)
    )
    const [iconToggles, setIconToggles] = useState<boolean[]>(LayerSlidersList.map(() => true))
    const [weatherEnabled, setWeatherEnabled] = useState(false)

    const slidersState = useMemo<FiltersContext>(
        () => ({
            sliderValues,
            setSliderValues,
            iconToggles,
            setIconToggles,
            setWeatherEnabled,
            weatherEnabled,
        }),
        [sliderValues, iconToggles, weatherEnabled]
    )

    return <FiltersContext.Provider value={slidersState}>{children}</FiltersContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFiltersContext = () => {
    const context = useContext(FiltersContext)

    if (!context) throw new Error("Using Sliders Context outside of provider")

    return context
}
