import axios from "axios";
axios.defaults.withCredentials = true;

export const axiosInstance = axios.create({
  baseURL: import.meta.mode === "development" ? "http://localhost:5000/api/" : "/api/",
  withCredentials: true // allows to send cookies
});

export default axiosInstance;