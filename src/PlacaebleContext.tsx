import type { LngLat } from "maplibre-gl"
import {
    createContext,
    useContext,
    useState,
    type FunctionComponent,
    type PropsWithChildren,
    type ReactNode,
} from "react"
import { useFiltersContext } from "./FiltersContext"
import { ToolsMap, type Tool } from "./Tools"

export interface Placeable {
    id: string
    type: Tool["id"]
    position: LngLat
    icon: ReactNode
}

interface PlaceableContext {
    items: Placeable[]
    add: (placeable: { position: LngLat; type: Tool["id"] }) => void
    remove: (id: string) => void
}

const PlaceableContext = createContext<PlaceableContext | undefined>(undefined)

const PlaceableProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const { iconToggles } = useFiltersContext()
    const [placed, setPlaced] = useState<Placeable[]>([])

    const treesEnabled = iconToggles[0]
    const factoriesEnabled = iconToggles[1]

    const filteredPlaced = placed
        .filter((item) => item.type !== "tree" || treesEnabled)
        .filter((item) => item.type !== "factory" || factoriesEnabled)

    const add: PlaceableContext["add"] = (placeable) => {
        const newPlaceable: Placeable = {
            icon: ToolsMap[placeable.type].icon,
            id: crypto.randomUUID(),
            position: placeable.position,
            type: placeable.type,
        }
        setPlaced((prev) => [...prev, newPlaceable])
    }

    const remove: PlaceableContext["remove"] = (id) => {
        setPlaced((prev) => prev.filter((v) => v.id !== id))
    }

    return (
        <PlaceableContext.Provider value={{ add, items: filteredPlaced, remove }}>
            {children}
        </PlaceableContext.Provider>
    )
}

const usePlaceableContext = () => {
    const context = useContext(PlaceableContext)

    if (!context) throw new Error("Cannot use PlaceableContext outside of provider")

    return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { PlaceableProvider, usePlaceableContext }
