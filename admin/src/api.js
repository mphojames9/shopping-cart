import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({ baseURL: API_URL });

// attach the admin token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// expired / invalid token -> tell the app to log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.dispatchEvent(new Event("admin-logout"));
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = "Something went wrong") =>
  error.response?.data?.message || fallback;

export default api;
