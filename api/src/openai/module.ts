export const multerFileToBase64 = (file: Express.Multer.File): string => {
    if (!file || !file.buffer) {
        throw new Error("Invalid Multer file: missing buffer")
    }

    const mimeType = file.mimetype || "application/octet-stream"
    const base64 = file.buffer.toString("base64")

    return `data:${mimeType};base64,${base64}`
}
