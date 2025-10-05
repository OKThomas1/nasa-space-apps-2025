import { jsPDF } from "jspdf"
import type { MapRef } from "react-map-gl/maplibre"

const renderHTMLToCanvas = async (
    element: HTMLElement,
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
): Promise<void> => {
    // Get the element dimensions
    const elementRect = element.getBoundingClientRect()

    // Create an SVG representation of the HTML content
    const serializer = new XMLSerializer()
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")

    svg.setAttribute("width", canvasWidth.toString())
    svg.setAttribute("height", canvasHeight.toString())
    svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`)

    // Create a foreignObject to hold the HTML content
    const foreignObject = document.createElementNS(svgNS, "foreignObject")
    foreignObject.setAttribute("width", "100%")
    foreignObject.setAttribute("height", "100%")

    // Clone the element and its children to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement

    // Apply inline styles to preserve appearance
    const applyInlineStyles = (el: HTMLElement, originalEl: HTMLElement) => {
        const computedStyle = window.getComputedStyle(originalEl)
        const styleStr = Array.from(computedStyle).reduce((str, property) => {
            return `${str}${property}:${computedStyle.getPropertyValue(property)};`
        }, "")
        el.setAttribute("style", styleStr)

        // Recursively apply to children
        for (let i = 0; i < el.children.length; i++) {
            const child = el.children[i] as HTMLElement
            const originalChild = originalEl.children[i] as HTMLElement
            if (child && originalChild) {
                applyInlineStyles(child, originalChild)
            }
        }
    }

    applyInlineStyles(clonedElement, element)

    // Create a wrapper div to ensure proper scaling
    const wrapper = document.createElement("div")
    wrapper.style.width = `${canvasWidth}px`
    wrapper.style.height = `${canvasHeight}px`
    wrapper.style.transform = `scale(${canvasWidth / elementRect.width}, ${canvasHeight / elementRect.height})`
    wrapper.style.transformOrigin = "top left"
    wrapper.appendChild(clonedElement)

    foreignObject.appendChild(wrapper)
    svg.appendChild(foreignObject)

    // Convert SVG to data URL
    const svgString = serializer.serializeToString(svg)
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

    // Create an image from the SVG and draw it on canvas
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            try {
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
                resolve()
            } catch (error) {
                reject(error)
            }
        }
        img.onerror = reject
        img.src = svgDataUrl
    })
}

// Common function to wait for map to be ready
const waitForMapReady = async (map: MapRef): Promise<void> => {
    if (!map.loaded() || !map.areTilesLoaded()) {
        await new Promise<void>((resolve) => {
            const checkLoaded = () => {
                if (map.loaded() && map.areTilesLoaded()) {
                    resolve()
                } else {
                    map.once("idle", checkLoaded)
                }
            }
            checkLoaded()
        })
    }

    // Wait for rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 500))
    await new Promise(requestAnimationFrame)
}

// Common function to get capture bounds and bounding box
const getCaptureInfo = (map: MapRef, excludeAnnotations?: boolean) => {
    const canvas = map.getCanvas()
    if (!canvas) {
        throw new Error("No canvas found")
    }

    const pdfFrame = document.getElementById("pdf-frame")
    if (!pdfFrame) {
        throw new Error("PDF frame element not found")
    }

    const frameRect = pdfFrame.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    // Get the PDF annotations element to subtract its width from the right side
    const pdfAnnotations = document.getElementById("pdf-annotations")
    const annotationsWidth =
        pdfAnnotations && excludeAnnotations ? pdfAnnotations.getBoundingClientRect().width : 0

    // Adjust the right boundary to exclude the annotations area
    const adjustedRight = frameRect.right - annotationsWidth

    // Calculate bounding box using map's unproject method
    const topLeft = map.unproject([frameRect.left, frameRect.top])
    const topRight = map.unproject([adjustedRight, frameRect.top])
    const bottomLeft = map.unproject([frameRect.left, frameRect.bottom])
    const bottomRight = map.unproject([adjustedRight, frameRect.bottom])

    const bbox = {
        minLng: Math.min(topLeft.lng, topRight.lng, bottomLeft.lng, bottomRight.lng),
        minLat: Math.min(topLeft.lat, topRight.lat, bottomLeft.lat, bottomRight.lat),
        maxLng: Math.max(topLeft.lng, topRight.lng, bottomLeft.lng, bottomRight.lng),
        maxLat: Math.max(topLeft.lat, topRight.lat, bottomLeft.lat, bottomRight.lat),
    }

    return {
        canvas,
        pdfFrame,
        frameRect,
        canvasRect,
        annotationsWidth,
        bbox,
    }
}

// Function to create canvas with map content
const createMapCanvas = async (map: MapRef) => {
    await waitForMapReady(map)

    // Don't exclude annotations for the full PDF - we want to include them
    const { canvas, pdfFrame, frameRect, canvasRect } = getCaptureInfo(map, false)

    const devicePixelRatio = window.devicePixelRatio || 1

    // Calculate coordinates relative to canvas - use full frame width (including annotations)
    const sx = (frameRect.left - canvasRect.left) * devicePixelRatio
    const sy = (frameRect.top - canvasRect.top) * devicePixelRatio
    const sw = frameRect.width * devicePixelRatio
    const sh = frameRect.height * devicePixelRatio

    // Ensure capture region is within canvas bounds
    const clampedSx = Math.max(0, sx)
    const clampedSy = Math.max(0, sy)
    const clampedSw = Math.min(sw, canvas.width - clampedSx)
    const clampedSh = Math.min(sh, canvas.height - clampedSy)

    const newCanvas = document.createElement("canvas")
    newCanvas.width = clampedSw
    newCanvas.height = clampedSh
    const newCtx = newCanvas.getContext("2d")
    if (!newCtx) throw new Error("Could not get canvas context")

    // Fill with white background first
    newCtx.fillStyle = "white"
    newCtx.fillRect(0, 0, clampedSw, clampedSh)

    newCtx.drawImage(canvas, clampedSx, clampedSy, clampedSw, clampedSh, 0, 0, clampedSw, clampedSh)

    // Clone the PDF frame and remove only the AI actions button (keep annotations for PDF)
    const clonedPdfFrame = pdfFrame.cloneNode(true) as HTMLElement
    const aiActionsBtn = clonedPdfFrame.querySelector("#btn-ai-actions")
    if (aiActionsBtn) {
        aiActionsBtn.remove()
    }

    // Render the PDF frame HTML content on top (includes annotations)
    await renderHTMLToCanvas(clonedPdfFrame, newCtx, clampedSw, clampedSh)

    return { canvas: newCanvas, width: clampedSw, height: clampedSh }
}

// Function to create cropped canvas excluding PDF annotations
const createCroppedMapCanvas = async (map: MapRef) => {
    await waitForMapReady(map)

    // Explicitly exclude annotations for the cropped version
    const { canvas, pdfFrame, frameRect, canvasRect, annotationsWidth } = getCaptureInfo(map, true)

    const devicePixelRatio = window.devicePixelRatio || 1

    // Calculate coordinates relative to canvas, excluding annotations area
    const croppedWidth = frameRect.width - annotationsWidth
    const sx = (frameRect.left - canvasRect.left) * devicePixelRatio
    const sy = (frameRect.top - canvasRect.top) * devicePixelRatio
    const sw = croppedWidth * devicePixelRatio
    const sh = frameRect.height * devicePixelRatio

    // Ensure capture region is within canvas bounds
    const clampedSx = Math.max(0, sx)
    const clampedSy = Math.max(0, sy)
    const clampedSw = Math.min(sw, canvas.width - clampedSx)
    const clampedSh = Math.min(sh, canvas.height - clampedSy)

    const newCanvas = document.createElement("canvas")
    newCanvas.width = clampedSw
    newCanvas.height = clampedSh
    const newCtx = newCanvas.getContext("2d")
    if (!newCtx) throw new Error("Could not get canvas context")

    // Fill with white background first
    newCtx.fillStyle = "white"
    newCtx.fillRect(0, 0, clampedSw, clampedSh)

    newCtx.drawImage(canvas, clampedSx, clampedSy, clampedSw, clampedSh, 0, 0, clampedSw, clampedSh)

    // Create a cropped version of the PDF frame content (excluding annotations)
    const croppedPdfFrame = document.createElement("div")
    croppedPdfFrame.style.width = `${croppedWidth}px`
    croppedPdfFrame.style.height = `${frameRect.height}px`
    croppedPdfFrame.style.overflow = "hidden"

    // Clone the PDF frame content but remove the annotations element and AI actions button
    const clonedFrame = pdfFrame.cloneNode(true) as HTMLElement

    // Find and remove the PDF annotations element from the cloned content
    const annotationsElement = clonedFrame.querySelector("#pdf-annotations")
    if (annotationsElement) {
        annotationsElement.remove()
    }

    // Also remove the AI actions button from the cropped version
    const aiActionsBtn = clonedFrame.querySelector("#btn-ai-actions")
    if (aiActionsBtn) {
        aiActionsBtn.remove()
    }

    croppedPdfFrame.appendChild(clonedFrame)

    // Render the cropped PDF frame HTML content on top (without annotations)
    await renderHTMLToCanvas(croppedPdfFrame, newCtx, clampedSw, clampedSh)

    return { canvas: newCanvas, width: clampedSw, height: clampedSh }
}

// Function to create JPEG file object and return it
export const createMapJpegFile = async (
    map: MapRef
): Promise<{ file: File; bbox: [number, number, number, number] }> => {
    const { canvas } = await createMapCanvas(map)
    const { bbox } = getCaptureInfo(map, false)

    console.log("Map snapshot bounding box:", bbox)
    console.log("Bounding box array format [minLng, minLat, maxLng, maxLat]:", [
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat,
    ])

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to create blob from canvas"))
                    return
                }
                const file = new File(
                    [blob],
                    `map-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
                    {
                        type: "image/jpeg",
                    }
                )
                resolve({ file, bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat] })
            },
            "image/jpeg",
            0.95
        )
    })
}

// Function to create cropped JPEG file excluding PDF annotations
export const createCroppedMapJpegFile = async (
    map: MapRef
): Promise<{ file: File; bbox: [number, number, number, number] }> => {
    const { canvas } = await createCroppedMapCanvas(map)
    const { bbox } = getCaptureInfo(map, true)

    console.log("Cropped map snapshot bounding box:", bbox)
    console.log("Bounding box array format [minLng, minLat, maxLng, maxLat]:", [
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat,
    ])

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to create blob from canvas"))
                    return
                }
                const file = new File(
                    [blob],
                    `map-cropped-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`,
                    {
                        type: "image/jpeg",
                    }
                )
                resolve({ file, bbox: [bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat] })
            },
            "image/jpeg",
            0.95
        )
    })
}

// Function to create and download JPEG
export const downloadMapJpeg = async (map: MapRef): Promise<void> => {
    const { canvas } = await createMapCanvas(map)
    const { bbox } = getCaptureInfo(map, false)

    console.log("Map snapshot bounding box:", bbox)
    console.log("Bounding box array format [minLng, minLat, maxLng, maxLat]:", [
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat,
    ])

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95)

    const a = document.createElement("a")
    a.href = imageDataUrl
    a.download = `map-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`
    a.click()
    a.remove()
}

// Function to create and download PDF
export const downloadMapPdf = async (map: MapRef): Promise<void> => {
    const { canvas, width, height } = await createMapCanvas(map)
    const { bbox } = getCaptureInfo(map, false)

    console.log("Map snapshot bounding box:", bbox)
    console.log("Bounding box array format [minLng, minLat, maxLng, maxLat]:", [
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat,
    ])

    const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
    })

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.95)
    pdf.addImage(imageDataUrl, "JPEG", 0, 0, width, height)
    pdf.save(`map-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`)
}

// Original function kept for backward compatibility - now downloads PDF
export const takeMapScreenshot = async (map: MapRef) => {
    if (!map) throw new Error("Map instance is required")

    // Wait for map to be fully loaded and all tiles to be loaded
    if (!map.loaded() || !map.areTilesLoaded()) {
        await new Promise<void>((resolve) => {
            const checkLoaded = () => {
                if (map.loaded() && map.areTilesLoaded()) {
                    resolve()
                } else {
                    map.once("idle", checkLoaded)
                }
            }
            checkLoaded()
        })
    }

    // Wait for rendering to complete
    await new Promise((resolve) => setTimeout(resolve, 500))
    await new Promise(requestAnimationFrame)

    const canvas = map.getCanvas()
    if (!canvas) {
        console.error("No canvas found")
        return
    }

    // Get the PDF frame element to determine capture bounds
    const pdfFrame = document.getElementById("pdf-frame")
    if (!pdfFrame) {
        console.error("PDF frame element not found")
        return
    }

    // Get the bounds of the PDF frame relative to the viewport
    const frameRect = pdfFrame.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()

    // Calculate the capture region relative to the canvas
    // Account for device pixel ratio for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1

    // Calculate coordinates relative to canvas
    const sx = (frameRect.left - canvasRect.left) * devicePixelRatio
    const sy = (frameRect.top - canvasRect.top) * devicePixelRatio
    const sw = frameRect.width * devicePixelRatio
    const sh = frameRect.height * devicePixelRatio

    // Ensure capture region is within canvas bounds
    const clampedSx = Math.max(0, sx)
    const clampedSy = Math.max(0, sy)
    const clampedSw = Math.min(sw, canvas.width - clampedSx)
    const clampedSh = Math.min(sh, canvas.height - clampedSy)

    const newCanvas = document.createElement("canvas")
    newCanvas.width = clampedSw
    newCanvas.height = clampedSh
    const newCtx = newCanvas.getContext("2d")
    if (!newCtx) return

    // Fill with white background first
    newCtx.fillStyle = "white"
    newCtx.fillRect(0, 0, clampedSw, clampedSh)

    newCtx.drawImage(canvas, clampedSx, clampedSy, clampedSw, clampedSh, 0, 0, clampedSw, clampedSh)

    // Render the PDF frame HTML content on top
    await renderHTMLToCanvas(pdfFrame, newCtx, clampedSw, clampedSh)

    // Convert canvas to PDF
    const pdf = new jsPDF({
        orientation: clampedSw > clampedSh ? "landscape" : "portrait",
        unit: "px",
        format: [clampedSw, clampedSh],
    })

    // Convert canvas to image data URL
    const imageDataUrl = newCanvas.toDataURL("image/jpeg", 0.95)

    // Add the image to PDF
    pdf.addImage(imageDataUrl, "JPEG", 0, 0, clampedSw, clampedSh)

    // Download the PDF
    pdf.save(`map-${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`)
}

type RGB = { r: number; g: number; b: number }

const hexToRgb = (hex: string): RGB => {
    const h = hex.replace("#", "")
    const v =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const r = parseInt(v.slice(0, 2), 16)
    const g = parseInt(v.slice(2, 4), 16)
    const b = parseInt(v.slice(4, 6), 16)
    return { r, g, b }
}

const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

const rgbToCss = ({ r, g, b }: RGB) => `rgb(${r}, ${g}, ${b})`

/**
 * Generate an array of CSS rgb() strings interpolated across N colors.
 * @param hexes  Ordered list of >= 2 hex colors.
 * @param steps  Number of output colors (>= 2).
 */
export const interpolateGradient = (hexes: string[], steps: number): string[] => {
    if (hexes.length < 2) throw new Error("interpolateGradient: need at least two colors")
    if (steps < 2) throw new Error("interpolateGradient: steps must be >= 2")

    const rgbs = hexes.map(hexToRgb)
    const segments = rgbs.length - 1
    const out: string[] = []

    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1) // 0..1
        // map t to a segment
        const segFloat = t * segments
        const seg = Math.min(Math.floor(segFloat), segments - 1)
        const localT = segFloat - seg
        const a = rgbs[seg]
        const b = rgbs[seg + 1]
        out.push(
            rgbToCss({
                r: lerp(a.r, b.r, localT),
                g: lerp(a.g, b.g, localT),
                b: lerp(a.b, b.b, localT),
            })
        )
    }
    return out
}
