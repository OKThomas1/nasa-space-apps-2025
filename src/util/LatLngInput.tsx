import { Grid, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import type { MapRef } from "react-map-gl/dist/esm/exports-maplibre"

const LatLngInput = ({ getMapRef }: { getMapRef: () => MapRef }) => {
    const mapRef = getMapRef()
    const [location, setLocation] = useState(mapRef.getCenter())
    useEffect(() => {
        const listener = () => {
            setLocation(mapRef.getCenter())
        }
        mapRef?.on("move", listener)

        return () => {
            mapRef?.off("move", listener)
        }
    }, [mapRef])

    return (
        <div className="bg-gray-100 p-2 rounded-lg">
            <LatLonForm
                latitude={location.lat}
                longitude={location.lng}
                setLatitude={(v) => {
                    mapRef.flyTo({ center: { lat: v, lng: location.lng } })
                    setLocation((prev) => {
                        prev.lat = v
                        return prev
                    })
                }}
                setLongitude={(v) => {
                    setLocation((prev) => {
                        prev.lng = v
                        return prev
                    })
                    mapRef.flyTo({ center: { lng: v, lat: location.lat } })
                }}
            />
        </div>
    )
}

const isValidLatitude = (lat: number) => !isNaN(lat) && lat >= -90 && lat <= 90
const isValidLongitude = (lon: number) => !isNaN(lon) && lon >= -180 && lon <= 180

const LatLonForm = ({
    latitude,
    setLatitude,
    longitude,
    setLongitude,
}: {
    latitude: number
    longitude: number
    setLatitude: (v: number) => void
    setLongitude: (v: number) => void
}) => {
    const [latError, setLatError] = useState("")
    const [lonError, setLonError] = useState("")

    const handleLatitudeChange = (e) => {
        const value = e.target.value
        setLatitude(value) // Update parent state immediately

        if (value === "" || isValidLatitude(parseFloat(value))) {
            setLatError("")
        } else {
            setLatError("Lat must be -90 to 90")
        }
    }

    const handleLongitudeChange = (e) => {
        const value = e.target.value
        setLongitude(value) // Update parent state immediately

        if (value === "" || isValidLongitude(parseFloat(value))) {
            setLonError("")
        } else {
            setLonError("Lon must be -180 to 180")
        }
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={6}>
                <TextField
                    label="Latitude"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={latitude}
                    onChange={handleLatitudeChange}
                    error={!!latError}
                    helperText={latError}
                    inputProps={{
                        step: "0.000001", // Allows for high precision
                    }}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label="Longitude"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={longitude}
                    onChange={handleLongitudeChange}
                    error={!!lonError}
                    helperText={lonError}
                    inputProps={{
                        step: "0.000001",
                    }}
                />
            </Grid>
        </Grid>
    )
}

export { LatLngInput }
