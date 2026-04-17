"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Wallet } from "lucide-react";

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

export function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference")?.trim() ?? "";
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastErrorMessage = useRef<string | null>(null);
  const { showToast } = useToast();
  const { mutate, isPending, error, isSuccess, data } = useVerifyOtpMutation();
  const hasSession = Boolean(data?.data?.user && data?.data?.token);

  const otpValue = useMemo(() => otp.join(""), [otp]);

  useEffect(() => {
    if (!reference) {
      showToast("Login reference is missing. Sign in again.", "error");
    }
  }, [reference, showToast]);

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
                  disabled={!reference || isPending}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!reference || otpValue.length !== OTP_LENGTH || isPending}
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
