import Button from "@mui/material/Button"
import type { FunctionComponent } from "react"
import { useToolContext } from "./ToolContext"
import { ToolsList } from "./Tools"

const ToolBar: FunctionComponent = () => {
    const { setTool, tool: selectedTool } = useToolContext()

    return (
        <div className="h-full flex flex-col gap-2 bg-gray-100 w-fit p-1 rounded-lg items-center justify-center">
            <div className="flex gap-2">
                <Button
                    onClick={() => setTool(undefined)}
                    sx={{ border: !selectedTool ? "1px solid blue" : "1px solid transparent" }}
                >
                    None
                </Button>
                {ToolsList.map((tool) => {
                    const isSelected = tool.id === selectedTool?.id
                    return (
                        <Button
                            onClick={() => setTool(tool)}
                            sx={{ border: isSelected ? "1px solid blue" : "1px solid transparent" }}
                            className={"flex flex-col"}
                            title={tool.description}
                        >
                            {tool.icon}
                            <small>{tool.displayName}</small>
                        </Button>
                    )
                })}
            </div>
        </div>
    )
}

export { ToolBar }
