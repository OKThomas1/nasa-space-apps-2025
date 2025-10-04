import cors from "cors"
import express from "express"
import openaqHandler from "./providers/openaq"
import tempoHandler from "./providers/tempo"
import worldpopHandler from "./providers/worldpop"

const app = express()
app.use(cors())
const PORT = process.env.PORT || "3000"

app.get("/tempo/:x/:y/:z", tempoHandler)
app.get("/openaq/:x/:y/:z", openaqHandler)
app.get("/worldpop/:x/:y/:z", worldpopHandler)

app.listen(parseInt(PORT), () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})
