'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLoginMutation } from '@/hooks/useLoginMutation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Wallet, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const lastErrorMessage = useRef<string | null>(null)

  const { mutate, isPending, error, isSuccess, data } = useLoginMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    lastErrorMessage.current = null
    mutate({ email: formData.email, password: formData.password })
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

    if (data?.data?.reference) {
      showToast(data.message || 'Enter the OTP sent to your email', 'success')

      const timeoutId = window.setTimeout(() => {
        router.push(`/verify-otp?reference=${encodeURIComponent(data.data.reference ?? '')}`)
      }, 500)

      return () => window.clearTimeout(timeoutId)
    }

    if (!data?.data?.user || !data?.data?.token) {
      showToast(data?.message || 'Login completed, but no session was returned', 'error')
      return
    }

    showToast(data?.message || 'Login successful', 'success')

    const timeoutId = window.setTimeout(() => {
      router.push('/dashboard')
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [data, isSuccess, router, showToast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinPower</span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Create one here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
