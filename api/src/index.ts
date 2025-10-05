import cors from "cors"
import express from "express"
import imageAnalysisRouter from "./openai/analyze-image"
import getPollutionSourcesRouter from "./openai/get-pollution-sources"
import tempoHandler from "./providers/tempo"
import weatherHandler from "./providers/weather"

const app = express()
app.use(cors())
const PORT = process.env.PORT || "3000"

app.use(express.json())

app.use("/analyze-image", imageAnalysisRouter)
app.use("/get-pollution-sources", getPollutionSourcesRouter)
app.get("/tempo/:x/:y/:z", tempoHandler)
app.get("/weather/:x/:y/:z", weatherHandler)

app.listen(parseInt(PORT), () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
