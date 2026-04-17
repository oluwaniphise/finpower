import { Suspense } from "react";

import { VerifyOtpContent } from "./verify-otp-content";

function VerifyOtpFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="text-sm text-gray-600">Preparing OTP verification...</div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<VerifyOtpFallback />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
