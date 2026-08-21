import express from "express";
import multer from "multer";
import { ensureAuthenticated } from "../middleware/auth.js";
import { ingestDocument } from "../utils/ingestDocument.js";
import Workspace from "../models/workspaces.js";
import Thread from "../models/threads.js";
import Document from "../models/documents.js";
import DocumentFile from "../models/documentFiles.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
});


// GET WORKSPACE DOCUMENTS

router.get(
    "/",
    ensureAuthenticated,
    async (req, res) => {

        try {

            const { workspaceId } = req.query;

            if (!workspaceId) {
                return res.status(400).json({
                    error: "workspaceId is required."
                });
            }

            const workspace = await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

            if (!workspace) {
                return res.status(403).json({
                    error: "You do not have access to this workspace."
                });
            }

            const documents = await Document.aggregate([
                {
                    $match: {
                        workspaceId
                    }
                },
                {
                    $group: {
                        _id: "$documentId",

                        filename: {
                            $first: "$filename"
                        },

                        createdAt: {
                            $first: "$createdAt"
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                }
            ]);

            res.json(documents);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: "Failed to fetch documents."
            });

        }

    }
);


// UPLOAD DOCUMENT

router.post(
    "/upload",
    ensureAuthenticated,
    upload.single("file"),
    async (req, res) => {


        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "No file uploaded."
                });
            }

            const {
                threadId,
                workspaceId
            } = req.body;

            if (!threadId) {
                return res.status(400).json({
                    error: "threadId is required."
                });
            }

            if (!workspaceId) {
                return res.status(400).json({
                    error: "workspaceId is required."
                });
            }


            // Verify workspace belongs to user

            const workspace = await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

            if (!workspace) {
                return res.status(403).json({
                    error: "You do not have access to this workspace."
                });
            }


            // Verify thread belongs to user

            const thread = await Thread.findOne({
                threadId,
                userId: req.user._id
            });

            if (
                thread &&
                thread.workspaceId !== workspaceId
            ) {

                return res.status(403).json({
                    error: "Thread does not belong to this workspace."
                });

            }


            const result = await ingestDocument(
                req.file,
                threadId,
                workspaceId
            );


            res.json(result);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: err.message
            });

        }

    }
);


// DELETE DOCUMENT

router.delete(
    "/:documentId",
    ensureAuthenticated,
    async (req, res) => {
        try {
            const { documentId } = req.params;
            const { workspaceId } = req.query;

            if (!workspaceId) {
                return res.status(400).json({
                    error: "workspaceId is required."
                });
            }

            const workspace = await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

            if (!workspace) {
                return res.status(403).json({
                    error: "You do not have access to this workspace."
                });
            }

            const document = await Document.findOne({
                documentId,
                workspaceId
            });

            if (!document) {
                return res.status(404).json({
                    error: "Document not found."
                });
            }

            const result = await Document.deleteMany({
                documentId,
                workspaceId
            });

            const fileResult = await DocumentFile.deleteMany({
                documentId,
                workspaceId
            });

            res.status(200).json({
                message: "Document deleted successfully.",
                deletedChunks: result.deletedCount,
                deletedFiles: fileResult.deletedCount
            });
        } catch (err) {
            console.error("Delete document error:", err);

            res.status(500).json({
                error: "Failed to delete document."
            });
        }
    }
);


// OPEN / DOWNLOAD DOCUMENT


router.get(
    "/:documentId/file",
    ensureAuthenticated,
    async (req, res) => {

        try {

            const { documentId } = req.params;
            const { workspaceId } = req.query;


            if (!workspaceId) {

                return res.status(400).json({
                    error: "workspaceId is required."
                });

            }


            // Verify workspace belongs to user

            const workspace = await Workspace.findOne({
                workspaceId,
                userId: req.user._id
            });

            if (!workspace) {

                return res.status(403).json({
                    error: "You do not have access to this workspace."
                });

            }


            // Find original file

            const document = await DocumentFile.findOne({
                documentId,
                workspaceId
            });

            if (!document) {

                return res.status(404).json({
                    error: "Document not found."
                });

            }


            res.set({

                "Content-Type":
                    document.mimeType,

                "Content-Disposition":
                    `inline; filename="${document.filename}"`

            });


            res.send(
                document.fileData
            );

        } catch (err) {

            console.error(err);

            res.status(500).json({
                error: "Failed to open document."
            });

        }

    }
);


export default router;