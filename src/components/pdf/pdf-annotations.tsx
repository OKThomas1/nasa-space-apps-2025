import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"
import { pollutants } from "./constants"
import { interpolateGradient } from "./module"
import type { Pollutant } from "./types"

export const PDFAnnotations = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cn("bg-white p-2 shadow w-full", props.className)}>
            <div className="mb-1">
                <h2 className="font-bold text-gray-800 text-center" style={{ fontSize: "0.6rem" }}>
                    Air Quality Legend
                </h2>
            </div>

            <table className="w-full border-collapse table-fixed">
                <colgroup>
                    <col className="w-1/5" />
                    <col className="w-3/5" />
                    <col className="w-1/5" />
                </colgroup>
                <thead>
                    <tr className="border-b border-gray-200">
                        <th
                            className="text-left py-0.5 px-0.5 font-semibold text-gray-700"
                            style={{ fontSize: "0.5rem" }}
                        >
                            Pollutant
                        </th>
                        <th
                            className="text-center py-0.5 px-0.5 font-semibold text-gray-700"
                            style={{ fontSize: "0.5rem" }}
                        >
                            Concentration
                        </th>
                        <th
                            className="text-right py-0.5 px-0.5 font-semibold text-gray-700"
                            style={{ fontSize: "0.5rem" }}
                        >
                            Unit
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pollutants.map((pollutant, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-b-0">
                            <PollutantRow pollutant={pollutant} />
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const PollutantRow = ({ pollutant }: { pollutant: Pollutant }) => {
    const colors = interpolateGradient(pollutant.colors, 10) // 10 boxes like before

    return (
        <>
            <td className="py-0.5 px-0.5 font-medium text-gray-800" style={{ fontSize: "0.5rem" }}>
                {pollutant.name}
            </td>
            <td className="py-0.5 px-0.5">
                <div className="flex items-center gap-0.5">
                    <span className="text-gray-600" style={{ fontSize: "0.45rem" }}>
                        {pollutant.minValue}
                    </span>
                    <div className="flex border border-gray-400 flex-1">
                        {colors.map((c, i) => (
                            <div
                                key={i}
                                className="flex-1 border-r border-gray-300 last:border-r-0"
                                style={{ backgroundColor: c, height: "0.4rem" }}
                            />
                        ))}
                    </div>
                    <span className="text-gray-600" style={{ fontSize: "0.45rem" }}>
                        {pollutant.maxValue}
                    </span>
                </div>
            </td>
            <td className="py-0.5 px-0.5 text-gray-500 text-right" style={{ fontSize: "0.45rem" }}>
                {pollutant.unit}
            </td>
        </>
    )
}
