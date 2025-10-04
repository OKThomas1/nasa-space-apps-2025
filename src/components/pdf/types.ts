import type { JSX } from "react"

export interface Pollutant {
    name: JSX.Element
    unit: string
    minValue: number
    maxValue: number
    minLabel: string
    maxLabel: string
    colorStart: string
    colorEnd: string
}
