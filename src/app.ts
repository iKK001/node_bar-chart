import * as fs from "fs"
import path from "path"
import { createCanvas, registerFont } from "canvas"

// Register the required font (optional, if you want to use a specific font)
// registerFont('path/to/your/font.ttf', { family: 'YourFontFamily' });

// Interface for the event data
interface EventData {
    meta: {
        format: string
        version: string
        projectId: string
        resourcePath: string[]
        recursive: boolean
        creationTime: number
        app: string
    }
    data: {
        adapter: string
        customer: {
            id: string
            subsidiaryId: string
        }
        events: {
            amount: number
            id: string
            labels: {
                custom: {
                    label: string
                    value: string
                }[]
                mainLabel: string
            }
        }[]
        id: string
        sensorBox: {
            id: string
        }
        version: number
        __collections__: unknown // You can define this properly based on the actual data
    }
}

const readJsonFromSrcFolder = (fileName: string): Promise<EventData> => {
    const filePath = path.join(__dirname, "..", "src/db/", fileName)

    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                reject(err)
            } else {
                try {
                    const jsonData = JSON.parse(data)
                    resolve(jsonData)
                } catch (parseError) {
                    reject(parseError)
                }
            }
        })
    })
}

const isValidEventData = (jsonData: any): jsonData is EventData => {
    if (!jsonData || typeof jsonData !== "object") {
        return false
    }

    // Check if all the required properties are present and have the correct types
    if (
        typeof jsonData.meta !== "object" ||
        typeof jsonData.data !== "object" ||
        !Array.isArray(jsonData.data.events)
    ) {
        return false
    }

    // Add more specific checks here if needed based on the actual data structure

    return true
}

const readDataFromFile = async (): Promise<EventData> => {
    const fileName = "aggregatedData.json" // Replace with the actual JSON file name

    try {
        const jsonData = await readJsonFromSrcFolder(fileName)
        // Validate or handle the jsonData if needed
        if (!isValidEventData(jsonData)) {
            throw new Error("Invalid JSON data format.")
        }
        return jsonData as EventData // Assert the type to EventData
    } catch (error) {
        console.error("Error reading JSON file:", error)
        throw error // Rethrow the error if needed
    }
}

// Helper function to extract labels and amounts from the data
const extractDataFromEvents = (events: EventData) => {
    const labels = events.data.events.map((event) => {
        return (
            event.labels.custom.find((item) =>
                item.label === "slideId" ? item.value : "",
            )?.value ?? ""
        )
    })
    const amounts = events.data.events.map((event) => event.amount)
    return { labels, amounts }
}

// get the data from the file
const createBarGraph = async () => {
    const data = await readDataFromFile()

    // Extract data from the events
    const { labels, amounts } = extractDataFromEvents(data)

    // Set font properties for the labels
    const fontSize = 12
    const fontFamily = "Arial"

    // Set the initial x-coordinate for drawing the bars
    let x = 0
    let y = 0

    // Set the bar width and gap between bars
    const barWidth = 30
    const barGap = 10

    // Create a new canvas and set its context
    const canvasWidth = (barWidth + barGap) * labels.length + 4
    const canvasHeight = 600
    const canvas = createCanvas(canvasWidth, canvasHeight)
    const ctx = canvas.getContext("2d")

    // Helper function to find the maximum value in an array
    const findMaxValue = (arr: number[]) => Math.max(...arr)

    // Calculate the scale for the y-axis
    const maxValue = findMaxValue(amounts)
    const yAxisScale = maxValue > 0 ? canvasHeight / maxValue : 1

    // Calculate label width and height
    const labelWidth = labels.reduce((maxWidth, label) => {
        const width = ctx.measureText(label).width
        return width > maxWidth ? width : maxWidth
    }, 0)
    const labelHeight = fontSize

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i]
        const amount = amounts[i]
        const barHeight = amount * yAxisScale

        x = barWidth * i + barGap * i + 2
        y = canvasHeight - labelHeight / 2

        // draw bar
        ctx.fillStyle = "rgba(54, 162, 235, 0.6)"
        ctx.strokeStyle = "rgba(54, 162, 235, 1)"
        ctx.lineWidth = 1
        ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight)
        ctx.strokeRect(x, canvasHeight - barHeight, barWidth, barHeight)

        x += barWidth / 2

        // draw label
        ctx.font = `${fontSize}px ${fontFamily}`
        ctx.fillStyle = "white"
        ctx.textBaseline = "middle"
        ctx.translate(x, y)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(label, 0, 0)
        ctx.rotate(Math.PI / 2)
        ctx.translate(-x, -y)
    }

    // Save the chart as a PNG image
    const out = fs.createWriteStream(__dirname + "/output/bar_chart.png")
    const stream = canvas.createPNGStream()
    stream.pipe(out)
    out.on("finish", () => console.log("The bar chart is saved."))
}

createBarGraph()
