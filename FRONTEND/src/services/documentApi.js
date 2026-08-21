import axios from "axios";
import { API_URL } from "../config.js";

const API = axios.create({
    baseURL: `${API_URL}/api/document`,
    withCredentials: true
});

export async function uploadDocument(
    file,
    threadId,
    workspaceId
) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("threadId", threadId);
    formData.append("workspaceId", workspaceId);

    const response = await API.post(
        "/upload",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;
}