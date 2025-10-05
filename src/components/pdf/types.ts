import type { JSX } from "react"

export interface Pollutant {
    name: JSX.Element
    unit: string
    minValue: number
    maxValue: number
    minLabel: string
    maxLabel: string
    colors: string[]
}

export interface PollutionActionables {
    meta: {
        bbox: [number, number, number, number]
        cellMeters: number
        notes: string
        assumptions: string
        sources: string[]
    }
    spots: Hotspot[]
}

export interface Hotspot {
    name: string
    bbox: [number, number, number, number]
    centroid: [number, number]
    rank: number
    scores: {
        pollution: number
        exposure: number
        overall: number
    }
    action: string
    rationale: string
    confidence: "low" | "medium" | "high"
    landmarks: Landmark[]
}

export interface Landmark {
    label: string
    distance_m: number
}
