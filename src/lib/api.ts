import axios from "axios";
export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 20000,
});
export const errorMessage = (e: unknown) =>
  axios.isAxiosError<{ error: string }>(e)
    ? e.response?.data.error || e.message
    : e instanceof Error
      ? e.message
      : "Something went wrong";
