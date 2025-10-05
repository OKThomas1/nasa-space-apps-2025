import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"

type PollutionSourcesModalProps = {
    open: boolean
    onClose: () => void
    data: any
}

export const PollutionSourcesModal = ({ open, onClose, data }: PollutionSourcesModalProps) => {
    if (!data) return null

    // Extract keys for sources (filter out non-source keys)
    const sourceKeys = Object.keys(data).filter(
        (key) => typeof data[key] === "object" && data[key].percent !== undefined
    )

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Pollution Sources</DialogTitle>
            <DialogContent>
                <div>
                    {sourceKeys.map((key) => (
                        <div key={key} style={{ marginBottom: "1em" }}>
                            <h3 style={{ margin: 0 }}>{key}</h3>
                            <strong>Percent:</strong> {data[key].percent}%
                            <br />
                            <strong>Reason:</strong> {data[key].reason}
                        </div>
                    ))}
                    <hr />
                    <h4>Map Features Detected</h4>
                    <ul>
                        {Array.isArray(data.map_features_detected) &&
                            data.map_features_detected.map((feature: string) => (
                                <li key={feature}>{feature}</li>
                            ))}
                    </ul>
                    <strong>Nearest Major City:</strong>
                    <div>{data.nearest_major_city}</div>
                </div>
                <Button onClick={onClose} variant="contained" sx={{ mt: 2 }}>
                    Close
                </Button>
            </DialogContent>
        </Dialog>
    )
}
