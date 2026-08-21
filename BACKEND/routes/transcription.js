import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";

const router = express.Router();

const storage = multer.diskStorage({
    destination: "uploads/",

    filename: (req, file, cb) => {
        cb(
            null,
            `recording-${Date.now()}.webm`
        );
    }
});

const upload = multer({
    storage
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

router.post(
    "/",
    upload.single("audio"),
    async (req, res) => {
        let filePath = null;

        try {
            if (!req.file) {
                return res.status(400).json({
                    error:
                        "No audio file provided."
                });
            }

            filePath = req.file.path;


            const transcription =
                await openai.audio.transcriptions.create({
                    file: fs.createReadStream(
                        filePath
                    ),
                    model: "gpt-4o-mini-transcribe"
                });

            res.json({
                text: transcription.text
            });

        } catch (err) {
            console.error(
                "Transcription error:",
                err
            );

            res.status(500).json({
                error:
                    err.message ||
                    "Failed to transcribe audio."
            });

        } finally {
            if (
                filePath &&
                fs.existsSync(filePath)
            ) {
                try {
                    fs.unlinkSync(filePath);
                } catch (cleanupError) {
                    console.error(
                        "Failed to delete temporary audio:",
                        cleanupError
                    );
                }
            }
        }
    }
);

export default router;