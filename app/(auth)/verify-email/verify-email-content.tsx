"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";

import { useVerifyEmailMutation } from "@/hooks/useVerifyEmailMutation";
import { useResendVerificationEmailMutation } from "@/hooks/useResendVerificationEmailMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const emailFromUrl = searchParams.get("email")?.trim() ?? "";
  const [resendEmail, setResendEmail] = useState(emailFromUrl);
  const { mutate, isPending, isSuccess, error, data } =
    useVerifyEmailMutation();
  const {
    mutate: resendVerificationEmail,
    isPending: isResendingVerificationEmail,
    error: resendVerificationEmailError,
    data: resendVerificationEmailData,
  } = useResendVerificationEmailMutation();
  const { showToast } = useToast();
  const submittedToken = useRef<string | null>(null);
  const lastErrorMessage = useRef<string | null>(null);
  const lastResendErrorMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!token || submittedToken.current === token) {
      return;
    }

    submittedToken.current = token;
    mutate({ token });
  }, [mutate, token]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    showToast(data?.message || "Email verified successfully", "success");
  }, [data?.message, isSuccess, showToast]);

  useEffect(() => {
    if (!error?.message || error.message === lastErrorMessage.current) {
      return;
    }

    lastErrorMessage.current = error.message;
    showToast(error.message, "error");
  }, [error, showToast]);

  useEffect(() => {
    if (
      !resendVerificationEmailError?.message ||
      resendVerificationEmailError.message === lastResendErrorMessage.current
    ) {
      return;
    }

    lastResendErrorMessage.current = resendVerificationEmailError.message;
    showToast(resendVerificationEmailError.message, "error");
  }, [resendVerificationEmailError, showToast]);

  useEffect(() => {
    if (!resendVerificationEmailData?.message) {
      return;
    }

    showToast(resendVerificationEmailData.message, "success");
  }, [resendVerificationEmailData?.message, showToast]);

  const handleResendVerificationEmail = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!resendEmail) {
      showToast("Enter your email address first", "error");
      return;
    }

    lastResendErrorMessage.current = null;
    resendVerificationEmail({ email: resendEmail });
  };

  const title = !token
    ? "Verification link is invalid"
    : isSuccess
      ? "Email verified"
      : error
        ? "Verification failed"
        : "Verifying your email";

  const description = !token
    ? "The verification token is missing from this link."
    : isSuccess
      ? "Your account has been confirmed. You can now sign in."
      : error
        ? error.message
        : "Please wait while we confirm your account.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinPower</span>
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            {!token || error ? (
              <AlertCircle className="h-8 w-8 text-red-600" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isSuccess ? (
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          ) : error && token ? (
            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={() => mutate({ token })}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Try Again"
              )}
            </Button>
          ) : null}

          {!isPending && !isSuccess ? (
            <form onSubmit={handleResendVerificationEmail} className="space-y-3">
              <div className="space-y-2 text-left">
                <Label htmlFor="resendEmail">Email</Label>
                <Input
                  id="resendEmail"
                  name="resendEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(event) => setResendEmail(event.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isResendingVerificationEmail}
              >
                {isResendingVerificationEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend verification email"
                )}
              </Button>
            </form>
          ) : null}

          {!isPending && !isSuccess ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/register">Back to Register</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
