import type { HTMLAttributes } from "react"
import { cn } from "../../lib/utils"
import { interpolateGradient } from "./module"
import type { Pollutant, PollutionActionables } from "./types"

const colors = interpolateGradient(["#B3874A", "#3A2A00"], 10)

export const PDFAnnotations = ({
    actionables,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    actionables?: PollutionActionables
}) => {
    return (
        <div
            id="pdf-annotations"
            {...props}
            className={cn("bg-white p-2 shadow w-full overflow-hidden", props.className)}
        >
            <div className="mb-1">
                <h2 className="font-bold text-gray-800 text-center" style={{ fontSize: "0.6rem" }}>
                    Air Quality Legend
                </h2>
            </div>

            <div className="flex items-center gap-0.5">
                <span className="text-gray-600" style={{ fontSize: "0.45rem" }}>
                    20
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
                    100
                </span>
            </div>

            {actionables && (
                <>
                    <h2
                        className="font-bold text-gray-800 text-center mt-4 mb-2"
                        style={{ fontSize: "0.6rem" }}
                    >
                        AI-Powered Actionables
                    </h2>
                    {actionables.spots.slice(0, 4).map((spot, i) => (
                        <div key={i} className="mb-2">
                            <p className="text-[0.5rem] leading-3 font-medium">
                                {spot.name.split("–")[0]}
                            </p>
                            <p className="text-[0.5rem] font-light">{spot.name.split("–")[1]} </p>
                            <div className="ml-3 font-extralight text-black/70">
                                <p className="text-[0.5rem]">Action: {spot.action}</p>
                                <p className="text-[0.5rem]">Rationale: {spot.rationale}</p>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}

const PollutantRow = ({ pollutant }: { pollutant: Pollutant }) => {
    const colors = interpolateGradient(pollutant.colors, 10)

    return (
        <>
            {/* <td className="py-0.5 px-0.5 font-medium text-gray-800" style={{ fontSize: "0.5rem" }}>
                {pollutant.name}
            </td> */}
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
            {/* <td className="py-0.5 px-0.5 text-gray-500 text-right" style={{ fontSize: "0.45rem" }}>
                {pollutant.unit}
            </td> */}
        </>
    )
}
