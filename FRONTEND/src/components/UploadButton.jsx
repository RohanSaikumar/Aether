import { useRef, useState } from "react";
import "./UploadButton.css";

export default function UploadButton({ onFileSelected }) {

    const inputRef = useRef(null);
    const [showInfo, setShowInfo] = useState(false);

    function handleFileSelect(e) {

        const file = e.target.files[0];

        if (!file) return;

        onFileSelected(file);

        e.target.value = "";
    }

    return (
        <div className="uploadWrapper">

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }}
                onChange={handleFileSelect}
            />

            <button
                type="button"
                className="uploadButton"
                onClick={() =>
                    inputRef.current.click()
                }
                onMouseEnter={() =>
                    setShowInfo(true)
                }
                onMouseLeave={() =>
                    setShowInfo(false)
                }
                title="Upload document"
            >
                <i className="fa-solid fa-paperclip"></i>
            </button>

            {showInfo && (
                <div className="uploadInfo">
                    <strong>Upload documents</strong>

                    <span>
                        Supported: PDF, DOC, DOCX, TXT
                    </span>
                </div>
            )}

        </div>
    );
}