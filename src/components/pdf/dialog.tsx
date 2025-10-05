import { CircularProgress, Dialog, DialogTitle } from "@mui/material"

export const ThinkingDialog = ({
    open,
    thinkingStep,
}: {
    open: boolean
    thinkingStep?: string
}) => {
    return (
        <Dialog open={open}>
            <DialogTitle className="text-gray-200 m-10 flex items-center gap-4 self-center">
                Generating AI-Powered Actionables
            </DialogTitle>
            <div className="flex mx-auto items-center mb-8 gap-3 px-4">
                <CircularProgress size={16} className="mb-1" />
                <h5 className="text-zinc-400 text-center">
                    <ShimmerText>{thinkingStep ? thinkingStep : "Thinking"}</ShimmerText>
                </h5>
            </div>
        </Dialog>
    )
}

export function ShimmerText({
    children,
    durationMs = 1500,
    pauseMs = 150,
}: {
    children: React.ReactNode
    durationMs?: number
    pauseMs?: number
}) {
    const total = durationMs + pauseMs
    const animName = "textShimmer"

    return (
        <span
            style={{
                display: "inline-block",
                position: "relative",
                color: "#d1d5db",
                overflow: "hidden",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        "linear-gradient(90deg, transparent 0%, #6b7280 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    backgroundPosition: "-200% 0",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    animation: `${animName} ${total}ms linear infinite`,
                }}
            >
                {children}
            </span>
            {children}
            <style>{`
        @keyframes ${animName} {
          0%   { background-position: 200% 0; }
          99%  { background-position: -200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
        </span>
    )
}
