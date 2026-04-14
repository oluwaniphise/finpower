'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Shield, Zap, Smartphone } from 'lucide-react'

export default function Home() {
  const { isAuthenticated, hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [hydrated, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FinPower</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Digital Wallet for
            <span className="text-blue-600"> Modern Finance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Secure, fast, and easy financial transactions. Pay bills, buy airtime,
            fund your wallet, and manage your money with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience seamless financial management with our comprehensive suite of services
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Airtime & Data</CardTitle>
              <CardDescription>
                Instant recharge for all networks with competitive rates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Electricity Bills</CardTitle>
              <CardDescription>
                Pay your electricity bills quickly and securely
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Wallet className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Wallet Funding</CardTitle>
              <CardDescription>
                Multiple payment options to fund your wallet instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Bank-Level Security</CardTitle>
              <CardDescription>
                Your money and data are protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Take Control of Your Finances?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust FinPower for their financial needs
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wallet className="h-6 w-6" />
            <span className="text-xl font-bold">FinPower</span>
          </div>
          <p className="text-center text-gray-400">
            © 2024 FinPower. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
