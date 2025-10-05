import dotenv from "dotenv"
dotenv.config()

import { Router } from "express"
import multer from "multer"
import OpenAI from "openai"
import { OpenAIPrompts } from "./constants"
import { multerFileToBase64 } from "./module"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

router.post("/", upload.single("map"), async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")

    try {
        const bbox = typeof req.body.bbox === "string" ? JSON.parse(req.body.bbox) : req.body.bbox

        const stream = await openai.responses.create({
            model: "gpt-5-mini-2025-08-07",
            reasoning: {
                summary: "detailed",
                effort: "medium",
            },
            stream: true,
            store: true,
            include: ["reasoning.encrypted_content"],
            instructions: OpenAIPrompts.ImageAnalysis.devMessage,
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: OpenAIPrompts.ImageAnalysis.userMessage(bbox),
                        },
                        {
                            type: "input_image",
                            detail: "auto",
                            image_url: multerFileToBase64(req.file!),
                        },
                    ],
                },
            ],
            text: {
                format: OpenAIPrompts.ImageAnalysis.responseSchema,
            },
        })

        let fullText = ""

        res.write(
            `${JSON.stringify({
                type: "step",
                content: "Analyzing map geography and pollution patterns",
            })}$`
        )

        for await (const chunk of stream) {
            switch (chunk.type) {
                case "response.reasoning_summary_part.done": {
                    const reasoningLine = chunk.part.text.split("\n")[0].replaceAll("**", "")

                    res.write(
                        `${JSON.stringify({
                            type: "step",
                            content: reasoningLine,
                        })}$`
                    )
                    break
                }
                case "response.output_text.done": {
                    fullText = chunk.text
                    break
                }
            }
        }

        res.write(
            `${JSON.stringify({
                type: "complete",
                content: JSON.parse(fullText),
            })}`
        )

        res.end()
    } catch (error) {
        console.error("Error processing images analysis:", error)
        res.status(500).end()
    }
})

export default router
