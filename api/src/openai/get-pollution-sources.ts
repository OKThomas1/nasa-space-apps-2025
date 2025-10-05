import dotenv from "dotenv"
dotenv.config()

import { Router } from "express"
import multer from "multer"
import OpenAI from "openai"

const router = Router()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } })

router.post("/", upload.none(), async (req, res) => {
    try {
        const latitude =
            typeof req.body.latitude === "string"
                ? JSON.parse(req.body.latitude)
                : req.body.latitude
        const longitude =
            typeof req.body.longitude === "string"
                ? JSON.parse(req.body.longitude)
                : req.body.longitude

        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Missing latitude or longitude" })
        }

        const response = await openai.responses.create({
            prompt: {
                id: process.env.OPENAI_GET_POLLUTION_SOURCES_PROMPT_ID!,
                variables: {
                    latitude: `${latitude}`,
                    longitude: `${longitude}`,
                },
            },
            max_output_tokens: 3600,
        })

        if (response.status !== "completed")
            throw new Error(
                `OpenAI response not completed (not enough token allowance): ${response.status}`
            )

        console.log(`Used ${response.usage?.output_tokens} output tokens`)

        res.status(200).json({ response: response.output_text })
    } catch (error) {
        console.error("Error analyzing location:", error)

        res.status(500).json({ error: "Internal server error" })
    }
})

export default router
