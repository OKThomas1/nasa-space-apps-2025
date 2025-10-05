import { useCallback, useRef, useState } from "react"
import { useMap } from "react-map-gl/maplibre"
import { createCroppedMapJpegFile } from "./module"
import type { PollutionActionables } from "./types"

export function useActionableGenerator() {
    const { map } = useMap()
    const [thinkingStep, setThinkingStep] = useState("")
    const [actionables, setActionables] = useState<PollutionActionables>()
    const xhrRef = useRef<XMLHttpRequest | null>(null)
    const bufferRef = useRef("")
    const [loading, setLoading] = useState(false)

    const generateActionables = useCallback(async () => {
        if (!map) throw new Error("Map instance is required")

        try {
            setLoading(true)
            setThinkingStep("")
            setActionables(undefined)

            const { file, bbox } = await createCroppedMapJpegFile(map)

            const formData = new FormData()
            formData.append("map", file)
            formData.append("bbox", JSON.stringify(bbox))

            const xhr = new XMLHttpRequest()
            xhrRef.current = xhr

            xhr.open("POST", "http://localhost:3000/analyze-image", true)
            xhr.setRequestHeader("Accept", "text/event-stream")

            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.LOADING && xhr.responseText) {
                    const newChunk = xhr.responseText.slice(bufferRef.current.length)
                    bufferRef.current = xhr.responseText

                    const events = newChunk.split("$").filter(Boolean)
                    for (const eventString of events) {
                        const event = JSON.parse(eventString)
                        if (event.type === "step") setThinkingStep(event.content)
                        else if (event.type === "complete") {
                            setActionables(event.content as PollutionActionables)
                            setLoading(false)
                        }
                    }
                }
            }

            xhr.send(formData)
        } catch (err) {
            console.error("Error in OpenAI analysis:", err)
            setLoading(false)
        }
    }, [map])

    return { generateActionables, thinkingStep, actionables, loading }
}
