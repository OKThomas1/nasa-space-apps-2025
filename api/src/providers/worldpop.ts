import { Response, Request } from "express"

const handler = (req: Request, res: Response) => {
    return res.end("test")
}

export default handler
