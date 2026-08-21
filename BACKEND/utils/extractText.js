import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

export async function extractText(file) {

    let text = "";

    if (file.mimetype === "application/pdf") {

        const pdf = await pdfParse(file.buffer);
        text = pdf.text;

    }

    else if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

        const result = await mammoth.extractRawText({
            buffer: file.buffer
        });

        text = result.value;

    }

    else if (file.mimetype === "text/plain") {

        text = file.buffer.toString("utf8");

    }

    else {

        throw new Error("Unsupported file type.");

    }

    return text;
}