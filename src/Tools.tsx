import FactoryIcon from "@mui/icons-material/Factory"
import ParkIcon from "@mui/icons-material/Park"
import SearchIcon from "@mui/icons-material/Search"
import type { ReactNode } from "react"

const buildTool = ({ displayName, icon, id, description, radius }: Tool): Tool => ({
    displayName,
    icon,
    id,
    description,
    radius,
})

export interface Tool {
    id: "tree" | "factory" | "pollution-source"
    displayName: string
    description: string
    icon: ReactNode
    radius: number
}

const ToolsMap: Record<Tool["id"], Tool> = {
    tree: buildTool({
        displayName: "Tree",
        icon: <ParkIcon sx={{ color: "green" }} />,
        id: "tree",
        description: "Represents 500 trees over 1 km²",
        radius: 564,
    }),
    factory: buildTool({
        displayName: "Factory",
        icon: <FactoryIcon sx={{ color: "brown" }} />,
        id: "factory",
        description: "Emits a large amount of Nitrogen Dioxide over a 16 km² area.",
        radius: 564 * 4,
    }),
    "pollution-source": buildTool({
        displayName: "Pollution Sources",
        icon: <SearchIcon sx={{ color: "purple" }} />,
        id: "pollution-source",
        description: "Generates an AI pollution report for a given location.",
        radius: 1,
    }),
}

const ToolsList = Object.values(ToolsMap)

export { ToolsList, ToolsMap }
