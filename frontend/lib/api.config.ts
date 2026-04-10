// Centralized API config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

if (!API_BASE_URL) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export { API_BASE_URL };
// process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

