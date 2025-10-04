import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import type { FunctionComponent } from "react"
import { useToolContext } from "./ToolContext"
import { ToolsList } from "./Tools"

const ToolBar: FunctionComponent = () => {
    const { setTool, tool } = useToolContext()

    return (
        <div className="h-full flex flex-col gap-2 bg-gray-100 w-fit p-2 rounded-lg">
            Selected: {tool?.displayName}
            <div className="flex gap-2">
                <Button onClick={() => setTool(undefined)} variant="contained">
                    None
                </Button>
                {ToolsList.map((tool) => (
                    <IconButton
                        onClick={() => setTool(tool)}
                        className="flex flex-col"
                        title="hello"
                    >
                        {tool.icon}
                        <small>{tool.displayName}</small>
                    </IconButton>
                ))}
            </div>
        </div>
    )
}

export { ToolBar }
