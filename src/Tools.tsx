import FactoryIcon from "@mui/icons-material/Factory"
import ParkIcon from "@mui/icons-material/Park"
import SearchIcon from "@mui/icons-material/Search"
import type { ReactNode } from "react"

const buildTool = ({ displayName, icon, id }: Tool): Tool => ({
    displayName,
    icon,
    id,
})

export interface Tool {
    id: "tree" | "factory" | "pollution-source"
    displayName: string
    icon: ReactNode
}

const ToolsMap: Record<Tool["id"], Tool> = {
    tree: buildTool({
        displayName: "Tree",
        icon: <ParkIcon sx={{ color: "green" }} />,
        id: "tree",
    }),
    factory: buildTool({
        displayName: "Factory",
        icon: <FactoryIcon sx={{ color: "brown" }} />,
        id: "factory",
    }),
    "pollution-source": buildTool({
        displayName: "Pollution Sources",
        icon: <SearchIcon sx={{ color: "purple" }} />,
        id: "pollution-source",
    }),
}

const ToolsList = Object.values(ToolsMap)

export { ToolsList, ToolsMap }
