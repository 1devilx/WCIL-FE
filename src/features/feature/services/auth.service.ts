import { serverApiClient } from "@/shared/lib/server-api-client";

import { AUTH_ROUTES } from "../constants/auth.constants";
import type {
  LoginRequest,
  OtpRequestResponse,
  OtpVerifyRequest,
  RegisterRequest,
  TokenResponse,
} from "../types/auth.types";

const publicRequest = { auth: false as const };

export const authService = {
  login(payload: LoginRequest): Promise<OtpRequestResponse> {
    return serverApiClient.post<OtpRequestResponse>(AUTH_ROUTES.login, payload, publicRequest);
  },

  verifyLogin(payload: OtpVerifyRequest): Promise<TokenResponse> {
    return serverApiClient.post<TokenResponse>(AUTH_ROUTES.loginVerify, payload, publicRequest);
  },

  register(payload: RegisterRequest): Promise<OtpRequestResponse> {
    return serverApiClient.post<OtpRequestResponse>(AUTH_ROUTES.register, payload, publicRequest);
  },

  verifyRegister(payload: OtpVerifyRequest): Promise<TokenResponse> {
    return serverApiClient.post<TokenResponse>(AUTH_ROUTES.registerVerify, payload, publicRequest);
  },

  refresh(refreshToken: string): Promise<TokenResponse> {
    return serverApiClient.post<TokenResponse>(
      AUTH_ROUTES.refresh,
      { refresh_token: refreshToken },
      publicRequest,
    );
  },

  logout(refreshToken: string): Promise<void> {
    return serverApiClient.post<void>(
      AUTH_ROUTES.logout,
      { refresh_token: refreshToken },
      publicRequest,
    );
  },
};
