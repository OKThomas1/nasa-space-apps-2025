import ElectricBoltIcon from "@mui/icons-material/ElectricBolt"
import ParkIcon from "@mui/icons-material/Park"
import type { ReactNode } from "react"

const buildTool = ({ displayName, icon, id }: Tool): Tool => ({
    displayName,
    icon,
    id,
})

export interface Tool {
    id: "tree" | "power-plant"
    displayName: string
    icon: ReactNode
}

const ToolsMap: Record<Tool["id"], Tool> = {
    tree: buildTool({
        displayName: "Tree",
        icon: <ParkIcon sx={{ color: "green" }} />,
        id: "tree",
    }),
    "power-plant": buildTool({
        displayName: "PowerPlant",
        icon: <ElectricBoltIcon sx={{ color: "green" }} />,
        id: "power-plant",
    }),
}

const ToolsList = Object.values(ToolsMap)

export { ToolsList, ToolsMap }
