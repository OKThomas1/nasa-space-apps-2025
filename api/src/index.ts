import cors from "cors"
import express from "express"
import imageAnalysisRouter from "./openai/analyze-image"
import getPollutionSourcesRouter from "./openai/get-pollution-sources"
import openaqHandler from "./providers/openaq"
import tempoHandler from "./providers/tempo"
import worldpopHandler from "./providers/worldpop"

const app = express()
app.use(cors())
const PORT = process.env.PORT || "3000"

app.use(express.json())

app.use("/analyze-image", imageAnalysisRouter)
app.use("/get-pollution-sources", getPollutionSourcesRouter)
app.get("/tempo/:x/:y/:z", tempoHandler)
app.get("/openaq/:x/:y/:z", openaqHandler)
app.get("/worldpop/:x/:y/:z", worldpopHandler)

app.listen(parseInt(PORT), () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
