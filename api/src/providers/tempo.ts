import { SourceFile } from "@chunkd/source-file"
import { exec } from "child_process"
import { Request, Response } from "express"
import fs, { existsSync } from "fs"
import { join } from "path"
import { promisify } from "util"
import { addJobToQueue, checkIfJobIsAlreadyRunning, waitForJob } from "../jobs"
import { tileBBoxLonLat, toZoom9 } from "../util/proj4"
import { getTileFromCogSource } from "../util/util-cog"

const execAsync = promisify(exec)

const urls = [
    {
        name: "no2",
        url: `https://gis.earthdata.nasa.gov/image/rest/services/C2930763263-LARC_CLOUD/TEMPO_NO2_L3_V03_HOURLY_TROPOSPHERIC_VERTICAL_COLUMN/ImageServer/exportImage`,
    },
    {
        name: "o3",
        url: `https://gis.earthdata.nasa.gov/image/rest/services/C2930764281-LARC_CLOUD/TEMPO_O3TOT_L3_V03_HOURLY_OZONE_COLUMN_AMOUNT/ImageServer/exportImage`,
    },
    {
        name: "hcho",
        url: `https://gis.earthdata.nasa.gov/image/rest/services/C2930761273-LARC_CLOUD/TEMPO_HCHO_L3_V03_HOURLY_VERTICAL_COLUMN/ImageServer/exportImage`,
    },
]

const handler = async (req: Request, res: Response) => {
    let aborted = false
    req.on("aborted", () => {
        aborted = true
    })

    const x = parseInt(req.params.x)
    const y = parseInt(req.params.y)
    const z = parseInt(req.params.z)

    const time = req.query.time as string

    const { x9, y9, z9 } = toZoom9(x, y, z)

    const dir = `./data/tempo2/${z9}/${x9}/${y9}`

    const file = time ? `${time}.tif` : "combined.tif"

    if (checkIfJobIsAlreadyRunning(dir)) {
        await waitForJob(dir)
    } else if (!existsSync(join(dir, file))) {
        const success = addJobToQueue(dir, async () => {
            fs.mkdirSync(`./data/tempo2/${z9}/${x9}/${y9}`, { recursive: true })

            const { west, east, north, south } = tileBBoxLonLat(x9, y9, z9)
            console.time("fetch")
            await Promise.all(
                urls.map(async (data) => {
                    const form = new FormData()
                    form.append("bbox", [west, south, east, north].join(","))
                    form.append("bboxSR", "102100")
                    form.append("imageSR", "102100")
                    form.append("size", "2000,2000")
                    form.append("f", "image")
                    form.append("format", "tiff")
                    form.append(
                        "time",
                        time ? `${time},${new Date().getTime()}` : "1690989120000,1758056640000"
                    )

                    const response = await fetch(data.url, { method: "POST", body: form })
                    const blob = Buffer.from(await response.arrayBuffer())

                    fs.writeFileSync(
                        `./data/tempo2/${z9}/${x9}/${y9}/${data.name}_${time}.tif`,
                        blob
                    )
                })
            )
            console.timeEnd("fetch")
            console.time("warp")
            for (const { name } of urls) {
                await execAsync(
                    `gdalwarp -t_srs EPSG:3857 -tr 9.554628535647032 9.554628535647032 -te ${west} ${south} ${east} ${north} -r bilinear -of GTiff ${join(dir, `${name}_${time}.tif`)} ${join(dir, `${name}_aligned_${time}.tif`)}`
                ).catch(console.error)
            }
            console.timeEnd("warp")

            console.time("vrt")
            await execAsync(
                `gdalbuildvrt -separate ${join(dir, `tempo_3band_${time}.vrt`)} ${join(dir, `no2_aligned_${time}.tif`)} ${join(dir, `hcho_aligned_${time}.tif`)} ${join(dir, `o3_aligned_${time}.tif`)}`
            )
            console.timeEnd("vrt")

            // console.time("vrt")
            // await execAsync(
            //     `gdalbuildvrt -separate ${join(dir, "tempo_3band.vrt")} ${join(dir, "no2.tif")} ${join(dir, "hcho.tif")} ${join(dir, "o3.tif")}`
            // )
            // console.timeEnd("vrt")

            console.time("translate")

            await execAsync(
                `gdal_translate ${join(dir, `tempo_3band_${time}.vrt`)} ${join(dir, `tempo_3band_${time}.tif`)} -of GTiff -b 1 -b 2 -b 3`
            )
            console.timeEnd("translate")
            console.time("cog")

            await execAsync(
                `gdal_translate ${join(dir, `tempo_3band_${time}.tif`)} ${join(dir, file)} -of COG -co COMPRESS=LZW -co NUM_THREADS=ALL_CPUS -co RESAMPLING=BILINEAR -co OVERVIEWS=IGNORE_EXISTING -co BLOCKSIZE=256 -co TILING_SCHEME=GoogleMapsCompatible -co ZOOM_LEVEL=14 -co OVERVIEW_COUNT=5`
            )

            console.timeEnd("cog")
        })
        if (!success) return res.status(500).json({ error: "Job queue is full" })
        await waitForJob(dir)
    } else {
        console.log("exists")
    }

    const tiff = new SourceFile(`./data/tempo2/${z9}/${x9}/${y9}/${file}`)
    const tile = await getTileFromCogSource(tiff, x, y, z)
    tiff.close()
    if (aborted) return
    return res.end(tile)
}

export default handler
