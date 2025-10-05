import type { MapMouseEvent } from "maplibre-gl"
import { useEffect } from "react"
import { useMap } from "react-map-gl/maplibre"
import { usePlaceableContext } from "./PlacaebleContext"
import { useToolContext } from "./ToolContext"

const ToolPlacementLayer = () => {
    const mapRef = useMap().current
    const { tool } = useToolContext()
    const { add } = usePlaceableContext()

    useEffect(() => {
        const handleClick = (e: MapMouseEvent) => {
            if (!tool) return

            add({ position: e.lngLat, type: tool.id })
        }

        mapRef?.on("click", handleClick)
        return () => {
            mapRef?.off("click", handleClick)
        }
    }, [add, mapRef, tool])

    return null
}

export { ToolPlacementLayer }
