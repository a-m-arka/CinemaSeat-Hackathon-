import axios from "axios"
import mockApiClient from "./mockClient"

const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api"
const apiMode = import.meta.env.VITE_API_MODE || (import.meta.env.VITE_API_BASE_URL ? "remote" : "mock")

const apiClient = axios.create({
  baseURL: backendBaseUrl,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
})

export function apiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error.response) return "Cannot reach CinemaSeat right now. Check your connection and try again."
  return error.response.data?.message || fallback
}

export default apiMode === "mock" ? mockApiClient : apiClient
