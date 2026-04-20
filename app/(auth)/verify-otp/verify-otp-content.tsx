"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Wallet } from "lucide-react";

import { useResendOtpMutation } from "@/hooks/useResendOtpMutation";
import { useVerifyOtpMutation } from "@/hooks/useVerifyOtpMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_MS = 1 * 60 * 1000;
const RESEND_STORAGE_KEY_PREFIX = "verify-otp-resend-available-at:";

function getCurrentTimestamp() {
  return Date.now();
}

function getResendStorageKey(reference: string) {
  return `${RESEND_STORAGE_KEY_PREFIX}${reference}`;
}

function getStoredAvailableAt(reference: string) {
  if (!reference || typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(getResendStorageKey(reference));
  const availableAt = storedValue ? Number(storedValue) : NaN;

  if (!Number.isFinite(availableAt)) {
    return null;
  }

  return availableAt;
}

function getRemainingCooldown(reference: string, now: number) {
  const availableAt = getStoredAvailableAt(reference);

  if (availableAt === null) {
    return 0;
  }

  return Math.max(0, availableAt - now);
}

function formatCooldown(milliseconds: number) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference")?.trim() ?? "";
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const [now, setNow] = useState(() => getCurrentTimestamp());
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastErrorMessage = useRef<string | null>(null);
  const { showToast } = useToast();
  const { mutate, isPending, error, isSuccess, data } = useVerifyOtpMutation();
  const {
    mutate: resendOtp,
    isPending: isResendingOtp,
  } = useResendOtpMutation();
  const hasSession = Boolean(data?.data?.user);

  const otpValue = useMemo(() => otp.join(""), [otp]);
  const resendCooldownMs = getRemainingCooldown(reference, now);
  const canResendOtp = Boolean(reference) && resendCooldownMs <= 0;
  const resendButtonLabel =
    resendCooldownMs > 0
      ? `Resend OTP in ${formatCooldown(resendCooldownMs)}`
      : "Resend OTP";

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const updateOtpAt = (index: number, value: string) => {
    setOtp((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  };

  useEffect(() => {
    if (!reference) {
      showToast("Login reference is missing. Sign in again.", "error");
    }
  }, [reference, showToast]);

  useEffect(() => {
    if (!reference) {
      return;
    }

    const storageKey = getResendStorageKey(reference);
    const existingAvailableAt = getStoredAvailableAt(reference);
    const currentTimestamp = getCurrentTimestamp();

    if (existingAvailableAt && existingAvailableAt > currentTimestamp) {
      return;
    }

    const initialAvailableAt = currentTimestamp + RESEND_COOLDOWN_MS;
    window.localStorage.setItem(storageKey, String(initialAvailableAt));
  }, [reference]);

  useEffect(() => {
    if (resendCooldownMs <= 0 || !reference) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nextNow = Date.now();
      const nextCooldown = getRemainingCooldown(reference, nextNow);

      if (nextCooldown <= 0) {
        window.localStorage.removeItem(getResendStorageKey(reference));
        setNow(nextNow);
        window.clearInterval(intervalId);
        return;
      }

      setNow(nextNow);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [reference, resendCooldownMs]);

  useEffect(() => {
    if (!error?.message || error.message === lastErrorMessage.current) {
      return;
    }

    lastErrorMessage.current = error.message;
    showToast(error.message, "error");
  }, [error, showToast]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    if (!hasSession) {
      showToast(data?.message || "OTP verified, but no session was returned", "error");
      return;
    }

    showToast(data?.message || "OTP verified successfully", "success");

    const timeoutId = window.setTimeout(() => {
      router.push("/dashboard");
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [data?.message, hasSession, isSuccess, router, showToast]);

  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");

    if (!sanitized) {
      updateOtpAt(index, "");
      return;
    }

    if (sanitized.length > 1) {
      const next = [...otp];

      sanitized.slice(0, OTP_LENGTH).split("").forEach((digit, offset) => {
        const targetIndex = index + offset;

        if (targetIndex < OTP_LENGTH) {
          next[targetIndex] = digit;
        }
      });

      setOtp(next);
      focusInput(Math.min(index + sanitized.length, OTP_LENGTH - 1));
      return;
    }

    updateOtpAt(index, sanitized);

    if (index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      updateOtpAt(index - 1, "");
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault();

    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH - index);

    if (!pastedDigits) {
      return;
    }

    const next = [...otp];

    pastedDigits.split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });

    setOtp(next);
    focusInput(Math.min(index + pastedDigits.length, OTP_LENGTH - 1));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    lastErrorMessage.current = null;

    if (!reference) {
      showToast("Login reference is missing. Sign in again.", "error");
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      showToast("Enter the 6-digit OTP sent to your email", "error");
      return;
    }

    mutate({ otp: otpValue, reference });
  };

  const handleResendOtp = () => {
    if (!reference) {
      showToast("Login reference is missing. Sign in again.", "error");
      return;
    }

    if (!canResendOtp) {
      showToast(
        `You can request another OTP in ${formatCooldown(resendCooldownMs)}`,
        "error",
      );
      return;
    }

    resendOtp(
      { reference },
      {
        onSuccess: (response) => {
          const nextReference = response.data?.reference;
          const referenceToStore =
            typeof nextReference === "string" && nextReference.trim()
              ? nextReference
              : reference;
          const nextAvailableAt = Date.now() + RESEND_COOLDOWN_MS;

          showToast(response.message || "OTP resent successfully", "success");
          setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
          focusInput(0);
          window.localStorage.setItem(
            getResendStorageKey(referenceToStore),
            String(nextAvailableAt),
          );
          setNow(getCurrentTimestamp());

          if (typeof nextReference === "string" && nextReference.trim()) {
            router.replace(`/verify-otp?reference=${encodeURIComponent(nextReference)}`);
          }
        },
        onError: (mutationError) => {
          showToast(mutationError.message, "error");
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinPower</span>
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email to complete sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={(event) => handlePaste(index, event)}
                  className="h-12 w-12 text-center text-lg font-semibold"
                  disabled={!reference || isPending || isResendingOtp}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!reference || otpValue.length !== OTP_LENGTH || isPending || isResendingOtp}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!canResendOtp || isPending || isResendingOtp}
              onClick={handleResendOtp}
            >
              {isResendingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                resendButtonLabel
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need to restart the flow?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Back to Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
