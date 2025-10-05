import CircularProgress from "@mui/material/CircularProgress"
import "maplibre-gl/dist/maplibre-gl.css"

import { forwardRef, useCallback, useState } from "react"
import Map, { type MapRef } from "react-map-gl/maplibre"

import { useLayers } from "../hooks/useLayers"
import { PlaceableBubbleLayer, PlaceableLayer } from "../PlaceableLayer"

import { PollutionSourcesModal } from "../PollutionSourcesModal"
import { useToolContext } from "../ToolContext"
import { ToolPlacementLayer } from "../ToolPlacementLayer"
import { DeckGLOverlay } from "./DeckglOverlay"

export const MapView = forwardRef<MapRef, { onLoad: () => void }>(
    ({ onLoad }: { onLoad: () => void }, ref) => {
        const layers = useLayers()
        const { tool } = useToolContext()
        const [modalOpen, setModalOpen] = useState(false)
        const [modalData, setModalData] = useState<any>(null)
        const [loading, setLoading] = useState(false)

        // Handler for map clicks
        const handleMapClick = useCallback(
            (event: any) => {
                if (tool?.id === "pollution-source") {
                    const { lngLat } = event
                    const latitude = lngLat.lat
                    const longitude = lngLat.lng
                    setLoading(true)
                    // Send to API
                    fetch(
                        "https://bin-obtained-subsidiary-notification.trycloudflare.com/get-pollution-sources",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "ngrok-skip-browser-warning": "true",
                            },
                            body: JSON.stringify({ latitude, longitude }),
                        }
                    )
                        .then(async (res) => {
                            if (!res.ok) {
                                const error = await res.json().catch(() => ({}))
                                throw new Error(error.error || "Unknown error")
                            }
                            return res.json()
                        })
                        .then((data) => {
                            setModalData(data.response ? JSON.parse(data.response) : data)
                            setModalOpen(true)
                        })
                        .catch((err) => {
                            alert("Error fetching pollution sources: " + err.message)
                        })
                        .finally(() => setLoading(false))
                }
            },
            [tool]
        )
        return (
            <div className="w-screen h-screen">
                {loading && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            display: "flex",
                            gap: "1em",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(255,255,255,0.5)",
                            zIndex: 9999,
                        }}
                    >
                        <CircularProgress size={32} />
                        <strong className="text-gray-50 text-2xl">
                            Analyzing pollution sources
                        </strong>
                    </div>
                )}
                <Map
                    // initialViewState={{
                    //     longitude: -80,
                    //     latitude: 49,
                    //     zoom: 3,
                    // }}
                    initialViewState={{
                        zoom: 11,
                        longitude: -123.236,
                        latitude: 48.43,
                    }}
                    maxZoom={20}
                    minZoom={9}
                    id="map"
                    onLoad={onLoad}
                    ref={ref}
                    mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`}
                    preserveDrawingBuffer={true}
                    onClick={handleMapClick} // Attach click handler
                >
                    <DeckGLOverlay interleaved={true} layers={layers} />

                    <PlaceableLayer />
                    <PlaceableBubbleLayer />
                    <ToolPlacementLayer />
                </Map>
                <PollutionSourcesModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    data={modalData}
                />
            </div>
        )
    }
)
