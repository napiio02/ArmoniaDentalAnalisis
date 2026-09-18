import axios from "axios";

export const API_URL = (import.meta.env.VITE_API_URL || "https://armoniadentalbackend.onrender.com/v1").replace(/\/$/, "");
let epoch = 0;
export const cambiarSesionLocal = () => { epoch += 1; };
export const epochSesion = () => epoch;
const ajustarURL = (url) => {
  const original = "https://armoniadentalbackend.onrender.com";
  if (typeof url === "string" && url.startsWith(API_URL + "/")) return url;
  if (typeof url !== "string" || !url.startsWith(original + "/")) return url;
  if (url.startsWith(original + "/api/")) return API_URL.replace(/\/[^/]+$/, "") + url.slice(original.length);
  return API_URL + url.slice(original.length).replace(/^\/v1/, "");
};
const notificar = (data, requestEpoch) => {
  if (requestEpoch !== epoch) return;
  if (["SESSION_INVALID", "FORBIDDEN", "AUTH_UNAVAILABLE"].includes(data?.code)) {
    window.dispatchEvent(new CustomEvent("auth:respuesta", { detail: data }));
  }
};
export const apiFetch = async (url, options = {}) => {
  const requestEpoch = epoch;
  const response = await fetch(ajustarURL(url), { ...options, credentials: "include", cache: "no-store" });
  if (!response.ok) {
    const data = await response.clone().json().catch(() => null);
    notificar(data, requestEpoch);
  }
  return response;
};
export const http = axios.create({ withCredentials: true });
http.interceptors.request.use((config) => {
  config.url = ajustarURL(config.url);
  config.withCredentials = true;
  config.authEpoch = epoch;
  return config;
});
http.interceptors.response.use((response) => response, (error) => {
  notificar(error.response?.data, error.config?.authEpoch);
  return Promise.reject(error);
});
