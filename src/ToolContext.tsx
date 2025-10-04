import {
    createContext,
    useContext,
    useMemo,
    useState,
    type FunctionComponent,
    type PropsWithChildren,
} from "react"

interface Tool {
    id: string
    displayName: string
    icon: string
}

type ToolContext = {
    tool: Tool | undefined
    setTool: (tool: Tool) => void
}

const ToolContext = createContext<ToolContext | undefined>(undefined)

export const ToolProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const [tool, setTool] = useState<Tool>()

    const toolState = useMemo<ToolContext>(() => ({ tool, setTool }), [tool])

    return <ToolContext.Provider value={toolState}>{children}</ToolContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToolContext = () => {
    const context = useContext(ToolContext)

    if (!context) throw new Error("Using Tool Context outside of provider")

    return context
}
