import {
    createContext,
    useContext,
    useMemo,
    useState,
    type FunctionComponent,
    type PropsWithChildren,
} from "react"

interface TimeContext {
    time: number | undefined
    setTime: (time: number) => void
}

const TimeContext = createContext<TimeContext | undefined>(undefined)

const TimeProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const [time, setTime] = useState<number>()

    const timeContext = useMemo<TimeContext>(() => ({ time, setTime }), [time])

    return <TimeContext.Provider value={timeContext}>{children}</TimeContext.Provider>
}

const useTimeContext = () => {
    const context = useContext(TimeContext)

    if (!context) throw new Error("Cannot use TimeContext outside of TimeProvider")

    return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { TimeProvider, useTimeContext }
