import type { Pollutant } from "./types"

export const pollutants: Pollutant[] = [
    {
        name: (
            <span>
                PM<sub>2.5</sub>
            </span>
        ),
        unit: "µg/m³",
        minValue: 0,
        maxValue: 250,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#90EE90",
        colorEnd: "#8B4513",
    },
    {
        name: (
            <span>
                PM<sub>10</sub>
            </span>
        ),
        unit: "µg/m³",
        minValue: 0,
        maxValue: 430,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#87CEEB",
        colorEnd: "#654321",
    },
    {
        name: (
            <span>
                O<sub>3</sub>
            </span>
        ),
        unit: "µg/m³",
        minValue: 0,
        maxValue: 800,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#98FB98",
        colorEnd: "#FF6347",
    },
    {
        name: (
            <span>
                NO<sub>2</sub>
            </span>
        ),
        unit: "µg/m³",
        minValue: 0,
        maxValue: 400,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#FFE4B5",
        colorEnd: "#FF8C00",
    },
    {
        name: (
            <span>
                SO<sub>2</sub>
            </span>
        ),
        unit: "µg/m³",
        minValue: 0,
        maxValue: 500,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#F5DEB3",
        colorEnd: "#8B4513",
    },
    {
        name: <span>CO</span>,
        unit: "mg/m³",
        minValue: 0,
        maxValue: 30,
        minLabel: "Safe",
        maxLabel: "Unsafe",
        colorStart: "#D3D3D3",
        colorEnd: "#2F4F4F",
    },
]
