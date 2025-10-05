import dotenv from "dotenv"
dotenv.config()

import { Router } from "express"
import multer from "multer"
import OpenAI from "openai"

const router = Router()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } })

router.post("/", upload.single("map"), async (req, res) => {
    let uploadedFile: (OpenAI.Files.FileObject & { _request_id?: string | null }) | undefined =
        undefined

    try {
        const bbox = typeof req.body.bbox === "string" ? JSON.parse(req.body.bbox) : req.body.bbox

        const fileObject = new File(
            [Buffer.from(req.file!.buffer)],
            req.file!.originalname || "map.jpg",
            {
                type: req.file!.mimetype || "image/jpeg",
            }
        )

        uploadedFile = await openai.files.create({
            file: fileObject,
            purpose: "vision",
        })

        const response = await openai.responses.create({
            prompt: {
                id: process.env.OPENAI_PROMPT_ID!,
                variables: {
                    bbox: JSON.stringify(bbox),
                },
            },
            input: [
                {
                    role: "user",
                    content: [{ type: "input_image", file_id: uploadedFile.id, detail: "auto" }],
                },
            ],
            max_output_tokens: 3600,
        })

        if (response.status !== "completed")
            throw new Error(
                `OpenAI response not completed (not enough token allowance): ${response.status}`
            )

        console.log(`Used ${response.usage?.output_tokens} output tokens`)

        res.status(200).json({ response: response.output_text })
    } catch (error) {
        console.error("Error processing images analysis:", error)

        res.status(500).json({ error: "Internal server error" })
    } finally {
        if (uploadedFile) await openai.files.delete(uploadedFile.id).catch(() => {})
    }
})

export default router
