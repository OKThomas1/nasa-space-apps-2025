import fs from "fs"

export async function exists(path: string) {
    try {
        await fs.promises.access(path)
        return true
    } catch {
        return false
    }
}
