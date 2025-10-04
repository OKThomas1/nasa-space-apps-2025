import Typography from "@mui/material/Typography"

const Legend = () => {
    return (
        <div className="bg-gray-100 w-full p-3 rounded-lg flex flex-col gap-2">
            <Typography>PM2.5: {}</Typography>
            <Typography>PM10: {}</Typography>
            <Typography>O3: {}</Typography>
            <Typography>NO3: {}</Typography>
            <Typography>SO2: {}</Typography>
            <Typography>CO: {}</Typography>
        </div>
    )
}

export { Legend }
