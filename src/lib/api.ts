import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/useAuthStore";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api";

export const api = axios.create({
    baseURL: API_URL,

    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },

    withCredentials: true,

    timeout: 30000,
});

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    (
        config: InternalAxiosRequestConfig
    ) => {

        const token =
            useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(

    (response) => response,

    async (error: AxiosError<any>) => {

        const originalRequest: any = error.config;

        /*
        |--------------------------------------------------------------------------
        | UNAUTHORIZED
        |--------------------------------------------------------------------------
        */

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry
        ) {

            originalRequest._retry = true;

            try {

                /*
                |--------------------------------------------------------------------------
                | OPTIONAL REFRESH TOKEN
                |--------------------------------------------------------------------------
                */

                const refreshToken =
                    useAuthStore
                        .getState()
                        .refreshToken;

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {
                        refresh_token: refreshToken,
                    }
                );

                const newToken =
                    response.data.access_token;

                useAuthStore
                    .getState()
                    .setToken(newToken);

                originalRequest.headers.Authorization =
                    `Bearer ${newToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                /*
                |--------------------------------------------------------------------------
                | FORCE LOGOUT
                |--------------------------------------------------------------------------
                */

                useAuthStore.getState().logout();

                if (typeof window !== "undefined") {
                    window.location.replace("/login");
                }

                return Promise.reject(refreshError);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SERVER ERRORS
        |--------------------------------------------------------------------------
        */

        if (error.response?.status === 500) {
            console.error(
                "Internal server error"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NETWORK ERRORS
        |--------------------------------------------------------------------------
        */

        if (!error.response) {
            console.error(
                "Network error"
            );
        }

        return Promise.reject(error);
    }
);