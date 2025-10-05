import type { Pollutant } from "./types"

export const pollutants: Pollutant[] = [
    {
        name: <span>Overall pollution</span>,
        unit: "index",
        minValue: 50,
        maxValue: 100,
        minLabel: "Good",
        maxLabel: "Hazardous",
        colors: ["#B3874A", "#3A2A00"],
    },
]
