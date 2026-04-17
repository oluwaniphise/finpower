'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRegisterMutation } from '@/hooks/useRegisterMutation'
import { useResendVerificationEmailMutation } from '@/hooks/useResendVerificationEmailMutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Wallet, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { showToast } = useToast()
  const lastErrorMessage = useRef<string | null>(null)
  const lastResendErrorMessage = useRef<string | null>(null)

  const { mutate, isPending, error, isSuccess, data } = useRegisterMutation()
  const {
    mutate: resendVerificationEmail,
    isPending: isResendingVerificationEmail,
    error: resendVerificationEmailError,
    data: resendVerificationEmailData,
  } = useResendVerificationEmailMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    lastErrorMessage.current = null

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 11) {
      showToast('Please enter a valid phone number', 'error')
      return
    }

    mutate({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phoneNumber: formData.phoneNumber,
    })
  }

  useEffect(() => {
    if (!error?.message || error.message === lastErrorMessage.current) {
      return
    }

    lastErrorMessage.current = error.message
    showToast(error.message, 'error')
  }, [error, showToast])

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    showToast(data?.message || 'Registration successful. Check your email to verify your account.', 'success')
  }, [data?.message, isSuccess, showToast])

  useEffect(() => {
    if (
      !resendVerificationEmailError?.message ||
      resendVerificationEmailError.message === lastResendErrorMessage.current
    ) {
      return
    }

    lastResendErrorMessage.current = resendVerificationEmailError.message
    showToast(resendVerificationEmailError.message, 'error')
  }, [resendVerificationEmailError, showToast])

  useEffect(() => {
    if (!resendVerificationEmailData?.message) {
      return
    }

    showToast(resendVerificationEmailData.message, 'success')
  }, [resendVerificationEmailData?.message, showToast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleResendVerificationEmail = () => {
    if (!formData.email) {
      showToast('Enter your email address first', 'error')
      return
    }

    lastResendErrorMessage.current = null
    resendVerificationEmail({ email: formData.email })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinPower</span>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Join thousands of users managing their finances with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <MailCheck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
                <p className="text-sm text-gray-600">
                  We sent a verification link to{' '}
                  <span className="font-medium text-gray-900">{formData.email}</span>.
                  Open the link to confirm your account before signing in.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/login">Go to Sign In</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isResendingVerificationEmail}
                onClick={handleResendVerificationEmail}
              >
                {isResendingVerificationEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
