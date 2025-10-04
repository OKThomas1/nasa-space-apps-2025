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

export const interpolateColor = (color1: string, color2: string, ratio: number): string => {
    const hex1 = color1.replace("#", "")
    const hex2 = color2.replace("#", "")

    const r1 = parseInt(hex1.substring(0, 2), 16)
    const g1 = parseInt(hex1.substring(2, 4), 16)
    const b1 = parseInt(hex1.substring(4, 6), 16)

    const r2 = parseInt(hex2.substring(0, 2), 16)
    const g2 = parseInt(hex2.substring(2, 4), 16)
    const b2 = parseInt(hex2.substring(4, 6), 16)

    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)

    return `rgb(${r}, ${g}, ${b})`
}
