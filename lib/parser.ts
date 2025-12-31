import PDFParser from "pdf2json";

export async function parsePdfResume(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // 1 = text content only

        pdfParser.on("pdfParser_dataError", (errData) => {
            console.error("PDF Parser Error:", errData);
            reject(new Error("Failed to parse PDF resume"));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
            // Extract raw text content
            const rawText = pdfParser.getRawTextContent();
            resolve(rawText);
        });

        // pdf2json expects a buffer, but its interface might check for file path usually.
        // For buffer parsing, we use parseBuffer.
        pdfParser.parseBuffer(buffer);
    });
}
