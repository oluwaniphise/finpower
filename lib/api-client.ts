import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

import type { Transaction } from "@/stores/wallet";
import type { User } from "@/stores/auth";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  otp: string;
  reference: string;
}

export interface ResendOtpPayload {
  reference: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationEmailPayload {
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
    reference?: string;
  };
  error?: string;
}

export interface AuthMeResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
  };
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface ResendVerificationEmailResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  message?: string;
  data?: {
    balance: number;
  };
  error?: string;
}

export interface CreditWalletPayload {
  amount: number;
  desc: string;
}

export interface CreditWalletResponse {
  success: boolean;
  message?: string;
  data?: {
    balance?: number;
    amount?: number;
    desc?: string;
    description?: string;
  };
  error?: string;
}

export interface BuyAirtimePayload {
  productCode: string;
  productItemCode: string;
  customerVendId: string;
  customerEmail: string;
  customerPhoneNumber: string;
  amount: number;
}

export interface BuyAirtimeResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface BillServiceProvider {
  id: number;
  name: string;
  code: string;
  displayImage: string;
  new: boolean;
  skipValidation: boolean;
}

export interface BillServiceItem {
  id: number;
  name: string;
  code: string;
  amount: number;
  minAmount: number;
  maxAmount: number;
  isFixedAmount: boolean;
  new: boolean;
  duration: number;
}

export interface BillServiceProvidersResponse {
  success: boolean;
  message?: string;
  data?: BillServiceProviderResponse;
  error?: string;
}

export interface BillServiceItemsResponse {
  success: boolean;
  message?: string;
  data?: BillServiceItemsProvidersResponse;
  error?: string;
}

export interface BillServiceItemsProvidersResponse {
  productID: string;
  productItems: BillServiceItem[];
}

export interface BillServiceProviderResponse {
  serviceCode: string;
  products?: BillServiceProvider[];
}

export interface TransactionsResponse {
  success: boolean;
  message?: string;
  data?: {
    transactions: Transaction[];
    meta: PaginationMeta;
  };
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsQuery {
  page?: number;
  limit?: number;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  withCredentials: true,
});

function isSuccessStatus(status: number) {
  return status >= 200 && status < 300;
}

function getResponseMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const item = payload as { message?: unknown };

  return typeof item.message === "string" ? item.message : undefined;
}

function toAuthUser(payload: unknown): User | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const id = item.id;
  const email = item.email;

  if (typeof id !== "string" || typeof email !== "string") {
    return null;
  }

  const firstName = typeof item.firstName === "string" ? item.firstName : "";
  const lastName = typeof item.lastName === "string" ? item.lastName : "";
  const name =
    typeof item.name === "string" && item.name.trim().length > 0
      ? item.name
      : `${firstName} ${lastName}`.trim() || email;
  const phoneNumber =
    typeof item.phoneNumber === "string"
      ? item.phoneNumber
      : typeof item.phone === "string"
        ? item.phone
        : undefined;

  return {
    id,
    email,
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phone: phoneNumber,
    phoneNumber,
    isVerified:
      typeof item.isVerified === "boolean" ? item.isVerified : undefined,
  };
}

function extractAuthUser(payload: unknown): User | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const responseData = payload as {
    data?: unknown;
    user?: unknown;
  };

  if (responseData.data && typeof responseData.data === "object") {
    const nestedData = responseData.data as { user?: unknown };
    return toAuthUser(nestedData.user ?? responseData.data);
  }

  return toAuthUser(responseData.user ?? payload);
}

function toAuthResponseData(payload: unknown): AuthResponse["data"] {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const item = payload as Record<string, unknown>;
  const user = extractAuthUser(payload) ?? undefined;
  const reference =
    typeof item.reference === "string" ? item.reference : undefined;

  if (!user && !reference) {
    return undefined;
  }

  return {
    user,
    reference,
  };
}

let refreshSessionPromise: Promise<boolean> | null = null;

async function refreshSession() {
  if (!API_URL) {
    return false;
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      try {
        const response = await axios.post("/api/auth/refresh", undefined, {
          validateStatus: () => true,
        });

        return isSuccessStatus(response.status);
      } catch (error) {
        return false;
      } finally {
        refreshSessionPromise = null;
      }
    })();
  }

  return refreshSessionPromise;
}

async function requestWithAuth<T = unknown>(
  config: AxiosRequestConfig,
  retryOnUnauthorized = true,
): Promise<AxiosResponse<T>> {
  const response = await api.request<T>(config);

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response;
  }

  const refreshed = await refreshSession();

  if (!refreshed) {
    return response;
  }

  return api.request<T>(config);
}

function extractBalance(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const responseData = payload as {
    balance?: unknown;
    data?: {
      balance?: unknown;
      wallet?: {
        balance?: unknown;
      };
    };
  };

  if (typeof responseData.balance === "number") {
    return responseData.balance;
  }

  if (typeof responseData.data?.balance === "number") {
    return responseData.data.balance;
  }

  if (typeof responseData.data?.wallet?.balance === "number") {
    return responseData.data.wallet.balance;
  }

  return undefined;
}

function toTransactionType(value: unknown): Transaction["type"] {
  if (typeof value === "string" && value.toLowerCase() === "credit") {
    return "credit";
  }

  return "debit";
}

function toTransactionAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function toTransactionRecord(payload: unknown): Transaction | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const amount = toTransactionAmount(
    item.amount ?? item.transactionAmount ?? item.value,
  );
  const rawType = item.type ?? item.transactionType ?? item.direction;
  const description =
    typeof item.description === "string"
      ? item.description
      : typeof item.desc === "string"
        ? item.desc
        : typeof item.narration === "string"
          ? item.narration
          : typeof item.reference === "string"
            ? item.reference
            : "Transaction";
  const category =
    typeof item.category === "string"
      ? item.category
      : typeof item.serviceType === "string"
        ? item.serviceType
        : typeof item.transactionCategory === "string"
          ? item.transactionCategory
          : typeof rawType === "string"
            ? rawType
            : "General";
  const dateValue =
    item.date ?? item.createdAt ?? item.updatedAt ?? item.transactionDate;

  return {
    id:
      typeof item.id === "string"
        ? item.id
        : typeof item._id === "string"
          ? item._id
          : typeof item.reference === "string"
            ? item.reference
            : `${description}-${amount}-${String(dateValue ?? Date.now())}`,
    type: toTransactionType(rawType),
    amount,
    description,
    date: typeof dateValue === "string" ? dateValue : new Date().toISOString(),
    category,
  };
}

function extractTransactions(payload: unknown): Transaction[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseData = payload as {
    data?: unknown;
    transactions?: unknown;
    results?: unknown;
  };

  let collection: unknown[] = [];

  if (Array.isArray(responseData.data)) {
    collection = responseData.data;
  } else if (responseData.data && typeof responseData.data === "object") {
    const nestedData = responseData.data as {
      transactions?: unknown;
      results?: unknown;
    };

    if (Array.isArray(nestedData.transactions)) {
      collection = nestedData.transactions;
    } else if (Array.isArray(nestedData.results)) {
      collection = nestedData.results;
    }
  } else if (Array.isArray(responseData.transactions)) {
    collection = responseData.transactions;
  } else if (Array.isArray(responseData.results)) {
    collection = responseData.results;
  }

  return collection
    .map((item) => toTransactionRecord(item))
    .filter((transaction): transaction is Transaction => transaction !== null);
}

function toPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return fallback;
}

function extractPaginationMeta(
  payload: unknown,
  fallback: PaginationMeta,
): PaginationMeta {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const responseData = payload as {
    meta?: unknown;
    data?: {
      meta?: unknown;
    };
  };
  const rawMeta =
    responseData.meta ??
    (responseData.data && typeof responseData.data === "object"
      ? responseData.data.meta
      : undefined);

  if (!rawMeta || typeof rawMeta !== "object") {
    return fallback;
  }

  const meta = rawMeta as Record<string, unknown>;
  const page = toPositiveInteger(meta.page, fallback.page);
  const limit = toPositiveInteger(meta.limit, fallback.limit);
  const total = toPositiveInteger(meta.total, fallback.total);
  const totalPages = toPositiveInteger(
    meta.totalPages,
    Math.max(1, Math.ceil(total / limit)),
  );

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

function getPayloadArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const responseData = payload as {
    data?: unknown;
    items?: unknown;
    results?: unknown;
  };

  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }

  if (responseData.data && typeof responseData.data === "object") {
    const nestedData = responseData.data as {
      items?: unknown;
      results?: unknown;
      services?: unknown;
    };

    if (Array.isArray(nestedData.items)) {
      return nestedData.items;
    }

    if (Array.isArray(nestedData.results)) {
      return nestedData.results;
    }

    if (Array.isArray(nestedData.services)) {
      return nestedData.services;
    }
  }

  if (Array.isArray(responseData.items)) {
    return responseData.items;
  }

  if (Array.isArray(responseData.results)) {
    return responseData.results;
  }

  return [];
}

function extractBillServiceProviders(
  payload: unknown,
  serviceCode: string,
): unknown[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const item = payload as BillServiceProviderResponse & {
    data?: unknown;
  };
  const normalizedServiceCode = serviceCode.toLowerCase();
  const directProviders = item[normalizedServiceCode as keyof typeof item];

  if (Array.isArray(directProviders)) {
    return directProviders;
  }

  if (item.data && typeof item.data === "object") {
    const nestedData = item.data as Record<string, unknown>;
    const nestedProviders = nestedData[normalizedServiceCode];

    if (Array.isArray(nestedProviders)) {
      return nestedProviders;
    }
  }

  return getPayloadArray(payload);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toBillServiceProvider(payload: unknown): BillServiceProvider | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const id = toNumber(item.id, Number.NaN);
  const name = typeof item.name === "string" ? item.name : undefined;
  const code = typeof item.code === "string" ? item.code : undefined;

  if (!Number.isFinite(id) || !name || !code) {
    return null;
  }

  return {
    id,
    name,
    code,
    displayImage:
      typeof item.displayImage === "string" ? item.displayImage : "",
    new: typeof item.new === "boolean" ? item.new : false,
    skipValidation:
      typeof item.skipValidation === "boolean" ? item.skipValidation : false,
  };
}

function toBillServiceItem(payload: unknown): BillServiceItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const id = toNumber(item.id, Number.NaN);
  const name = typeof item.name === "string" ? item.name : undefined;
  const code = typeof item.code === "string" ? item.code : undefined;

  if (!Number.isFinite(id) || !name || !code) {
    return null;
  }

  return {
    id,
    name,
    code,
    amount: toNumber(item.amount),
    minAmount: toNumber(item.minAmount),
    maxAmount: toNumber(item.maxAmount),
    isFixedAmount:
      typeof item.isFixedAmount === "boolean" ? item.isFixedAmount : false,
    new: typeof item.new === "boolean" ? item.new : false,
    duration: toNumber(item.duration),
  };
}

export const apiClient = {
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await axios.post("/api/auth/logout", undefined, {
        validateStatus: () => true,
      });
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Logout failed",
        };
      }

      return {
        success: true,
        message: data?.message,
      };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "An error occurred during logout",
      };
    }
  },

  async getCurrentUser(): Promise<AuthMeResponse> {
    try {
      const response = await requestWithAuth({
        url: "/auth/me",
        method: "GET",
      });

      const data = response.data;
      const user = extractAuthUser(data);

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) || "Failed to fetch current user",
        };
      }

      if (!user) {
        return {
          success: false,
          error: "Current user was not returned by the server",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: { user },
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        error: "An error occurred while fetching the current user",
      };
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/login", payload);
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Login failed",
        };
      }

      const authData = toAuthResponseData(data?.data ?? data);

      if (authData?.user || authData?.reference) {
        return {
          success: true,
          message: data?.message,
          data: authData,
        };
      }

      const currentUserResponse = await requestWithAuth({
        url: "/auth/me",
        method: "GET",
      });
      const currentUserData = currentUserResponse.data;
      const currentUser = extractAuthUser(currentUserData);

      if (!isSuccessStatus(currentUserResponse.status) || !currentUser) {
        return {
          success: false,
          error: "Login succeeded, but the session could not be restored.",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: { user: currentUser },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "An error occurred during login",
      };
    }
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    try {
      const response = await axios.post("/api/auth/login/verify-otp", payload, {
        validateStatus: () => true,
      });
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "OTP verification failed",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data.data,
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        error: "An error occurred while verifying OTP",
      };
    }
  },

  async resendOtp(payload: ResendOtpPayload): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/login/resend-otp", payload);
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Failed to resend OTP",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: toAuthResponseData(data?.data ?? data),
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        error: "An error occurred while resending OTP",
      };
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/register", payload);
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Registration failed",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: toAuthResponseData(data?.data ?? data),
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: "An error occurred during registration",
      };
    }
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
    try {
      const response = await api.post("/auth/verify-email", payload);
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Email verification failed",
        };
      }

      return {
        success: true,
        message: data?.message || "Email verified successfully",
        data: data?.data ?? data,
      };
    } catch (error) {
      console.error("Verify email error:", error);
      return {
        success: false,
        error: "An error occurred while verifying your email",
      };
    }
  },

  async resendVerificationEmail(
    payload: ResendVerificationEmailPayload,
  ): Promise<ResendVerificationEmailResponse> {
    try {
      const response = await api.post(
        "/auth/resend-verification-email",
        payload,
      );
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error: data?.message || "Failed to resend verification email",
        };
      }

      return {
        success: true,
        message: data?.message || "Verification email sent",
        data: data?.data ?? data,
      };
    } catch (error) {
      console.error("Resend verification email error:", error);
      return {
        success: false,
        error: "An error occurred while resending the verification email",
      };
    }
  },

  async getWalletBalance(): Promise<WalletBalanceResponse> {
    try {
      const response = await requestWithAuth({
        url: "/wallet/balance",
        method: "GET",
      });

      const data = response.data;
      const balance = extractBalance(data);

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) || "Failed to fetch wallet balance",
        };
      }

      if (typeof balance !== "number") {
        return {
          success: false,
          error: "Wallet balance was not returned by the server",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: { balance },
      };
    } catch (error) {
      console.error("Get wallet balance error:", error);
      return {
        success: false,
        error: "An error occurred while fetching wallet balance",
      };
    }
  },

  async creditWallet(
    payload: CreditWalletPayload,
  ): Promise<CreditWalletResponse> {
    try {
      const response = await requestWithAuth({
        url: "/wallet/credit",
        method: "POST",
        data: payload,
      });

      const data = response.data;
      const balance = extractBalance(data);

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) || "Failed to credit wallet",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: {
          balance,
          amount: payload.amount,
          desc: payload.desc,
          description: payload.desc,
        },
      };
    } catch (error) {
      console.error("Credit wallet error:", error);
      return {
        success: false,
        error: "An error occurred while crediting wallet",
      };
    }
  },

  async buyAirtime(payload: BuyAirtimePayload): Promise<BuyAirtimeResponse> {
    try {
      const response = await requestWithAuth({
        url: "/bills/airtime",
        method: "POST",
        data: payload,
      });
      const data = response.data;
      const responseError =
        data && typeof data === "object" && "error" in data
          ? data.error
          : undefined;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) ||
                (typeof responseError === "string"
                  ? responseError
                  : undefined) ||
                "Failed to buy airtime",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data:
          data && typeof data === "object" && "data" in data
            ? (data.data as Record<string, unknown>)
            : (data as Record<string, unknown>),
      };
    } catch (error) {
      console.error("Buy airtime error:", error);
      return {
        success: false,
        error: "An error occurred while buying airtime",
      };
    }
  },

  async getBillServiceProviders(
    serviceCode: string,
  ): Promise<BillServiceProvidersResponse> {
    try {
      const response = await requestWithAuth({
        url: `/bills/services/${encodeURIComponent(serviceCode)}/items`,
        method: "GET",
      });
      const data = response.data;
      console.log(data);

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) || "Failed to fetch bill services",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: data?.data,
      };
    } catch (error) {
      console.error("Get bill service providers error:", error);
      return {
        success: false,
        error: "An error occurred while fetching bill services",
      };
    }
  },

  async getBillServiceItems(
    serviceId: number,
  ): Promise<BillServiceItemsResponse> {
    try {
      const response = await requestWithAuth({
        url: `/bills/services/items/${serviceId}`,
        method: "GET",
      });
      const data = response.data;

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) ||
                "Failed to fetch bill service items",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: data?.data
      };
    } catch (error) {
      console.error("Get bill service items error:", error);
      return {
        success: false,
        error: "An error occurred while fetching bill service items",
      };
    }
  },

  async getMyTransactions(
    query: TransactionsQuery = {},
  ): Promise<TransactionsResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      const response = await requestWithAuth({
        url: `/transactions/me?${searchParams.toString()}`,
        method: "GET",
      });

      const data = response.data;
      const transactions = extractTransactions(data);
      const meta = extractPaginationMeta(data, {
        page,
        limit,
        total: transactions.length,
        totalPages: Math.max(1, Math.ceil(transactions.length / limit)),
      });

      if (!isSuccessStatus(response.status)) {
        return {
          success: false,
          error:
            response.status === 401
              ? "Session expired. Please sign in again."
              : getResponseMessage(data) || "Failed to fetch transactions",
        };
      }

      return {
        success: true,
        message: getResponseMessage(data),
        data: {
          transactions,
          meta,
        },
      };
    } catch (error) {
      console.error("Get transactions error:", error);
      return {
        success: false,
        error: "An error occurred while fetching transactions",
      };
    }
  },
};
