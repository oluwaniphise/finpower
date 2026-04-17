import { useAuthStore } from "@/stores/auth";
import type { Transaction } from "@/stores/wallet";

const API_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL?.trim();

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  otp: string;
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
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string;
    };
    token?: string;
    reference?: string;
  };
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

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
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

export const apiClient = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data.data,
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
      const response = await fetch(`${API_URL}/auth/login/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || "OTP verification failed",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data?.data,
      };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        error: "An error occurred while verifying OTP",
      };
    }
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Registration failed",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data.data,
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
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
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
      const response = await fetch(
        `${API_URL}/auth/resend-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await parseJsonResponse(response);

      if (!response.ok) {
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
      const response = await fetch(`${API_URL}/wallet/balance`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await parseJsonResponse(response);
      const balance = extractBalance(data);

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || "Failed to fetch wallet balance",
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
        message: data?.message,
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
      const response = await fetch(`${API_URL}/wallet/credit`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);
      const balance = extractBalance(data);

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || "Failed to credit wallet",
        };
      }

      return {
        success: true,
        message: data?.message,
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
      const response = await fetch("/api/bills/airtime", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || data?.error || "Failed to buy airtime",
        };
      }

      return {
        success: true,
        message: data?.message,
        data: data?.data ?? data,
      };
    } catch (error) {
      console.error("Buy airtime error:", error);
      return {
        success: false,
        error: "An error occurred while buying airtime",
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
      const response = await fetch(
        `${API_URL}/transactions/me?${searchParams.toString()}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        },
      );

      const data = await parseJsonResponse(response);
      const transactions = extractTransactions(data);
      const meta = extractPaginationMeta(data, {
        page,
        limit,
        total: transactions.length,
        totalPages: Math.max(1, Math.ceil(transactions.length / limit)),
      });

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || "Failed to fetch transactions",
        };
      }

      return {
        success: true,
        message: data?.message,
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
