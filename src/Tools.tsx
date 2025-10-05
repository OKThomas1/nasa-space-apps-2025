import FactoryIcon from "@mui/icons-material/Factory"
import ParkIcon from "@mui/icons-material/Park"
import type { ReactNode } from "react"

const buildTool = ({ displayName, icon, id }: Tool): Tool => ({
    displayName,
    icon,
    id,
})

export interface Tool {
    id: "tree" | "factory"
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
}

const ToolsList = Object.values(ToolsMap)

export { ToolsList, ToolsMap }
