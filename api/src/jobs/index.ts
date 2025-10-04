import EventEmitter from "events"

const jobEmitter = new EventEmitter()

type PromiseFunction = () => Promise<void>

const jobs = [] as { id: string; promise: PromiseFunction | Promise<void> }[]

const finishJob = () => {
    jobs.shift()
    if (jobs.length) (jobs[0].promise as PromiseFunction)()
}

export const addJobToQueue = (id: string, job: PromiseFunction) => {
    if (jobs.length > 10) return false
    if (jobs.length === 0) {
        jobs.push({
            id,
            promise: job()
                .then(() => {
                    jobEmitter.emit(id + "done")
                    finishJob()
                })
                .catch(() => {
                    jobEmitter.emit(id + "done")
                }),
        })
    } else
        jobs.push({
            id,
            promise: () =>
                job()
                    .then(() => {
                        jobEmitter.emit(id + "done")
                        finishJob()
                    })
                    .catch(() => {
                        jobEmitter.emit(id + "done")
                    }),
        })
}

export const checkIfJobIsAlreadyRunning = (id: string) => {
    return !!jobs.find((e) => e.id === id)
}

export const waitForJob = (id: string) => {
    return new Promise((res) => {
        jobEmitter.once(id + "done", res)
    })
}
