import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import Document from "../models/documents.js";
import { extractText } from "./extractText.js";
import { chunkText } from "./chunkText.js";
import { getEmbedding } from "./embeddings.js";
import DocumentFile from "../models/documentFiles.js";

export async function ingestDocument(
    file,
    threadId,
    workspaceId
) {

    // Generate SHA-256 fingerprint of the actual file
    const fileHash = crypto
        .createHash("sha256")
        .update(file.buffer)
        .digest("hex");


    // Check if this exact file already exists
    // inside this workspace
    const existingDocument = await Document.findOne({
        workspaceId,
        fileHash
    });

    if (existingDocument) {


        return {

            success: true,

            duplicate: true,

            documentId: existingDocument.documentId,

            filename: existingDocument.filename,

            chunksStored: 0,

            chunks: []

        };

    }


    // Extract text from uploaded document
    const text = await extractText(file);

    if (!text || text.trim().length === 0) {
        throw new Error(
            "No text could be extracted from the document."
        );
    }


    // Split into semantic chunks
    const chunks = chunkText(text);


    // Generate unique ID for this document
    const documentId = uuidv4();

    await DocumentFile.create({

        documentId,

        workspaceId,

        filename: file.originalname,

        fileHash,

        mimeType: file.mimetype,

        fileData: file.buffer

    });


    // Store each chunk separately
    for (let i = 0; i < chunks.length; i++) {


        const embedding = await getEmbedding(
            chunks[i]
        );


        await Document.create({

            threadId,

            workspaceId,

            documentId,

            fileHash,

            filename: file.originalname,

            chunkNumber: i,

            text: chunks[i],

            embedding

        });


    }



    return {

        success: true,

        duplicate: false,

        documentId,

        filename: file.originalname,

        chunksStored: chunks.length,

        chunks

    };

}