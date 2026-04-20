'use client'

import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Home,
  CreditCard,
  Zap,
  Smartphone,
  Receipt,
  LogOut,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Fund Wallet', href: '/wallet/fund', icon: CreditCard },
  { name: 'Buy Airtime', href: '/bills/airtime', icon: Smartphone },
  { name: 'Buy Data', href: '/bills/data', icon: Smartphone },
  { name: 'Pay Electricity', href: '/bills/electricity', icon: Zap },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/wallet/fund': 'Fund Wallet',
  '/bills/airtime': 'Buy Airtime',
  '/bills/data': 'Buy Data',
  '/bills/electricity': 'Pay Electricity Bill',
  '/transactions': 'Transaction History'
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, hydrated, setUser } = useAuthStore()
  const { setBalance, setTransactions } = useWalletStore()
  const [sessionVerified, setSessionVerified] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!hydrated) {
      return
    }

    let isActive = true

    const verifySession = async () => {
      setSessionVerified(false)

      const response = await apiClient.getCurrentUser()

      if (!isActive) {
        return
      }


      if (response.success && response.data?.user) {
        setUser(response.data?.user)
        setSessionVerified(true)
        return
      }

      logout()
      router.push('/login')
    }

    void verifySession()

    return () => {
      isActive = false
    }
  }, [hydrated, logout, router, setUser])

  useEffect(() => {
    if (!hydrated || !sessionVerified) {
      return
    }

    const syncDashboardData = async () => {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        apiClient.getWalletBalance(),
        apiClient.getMyTransactions(),
      ])

      const sessionExpired =
        (!balanceResponse.success && balanceResponse.error === 'Session expired. Please sign in again.') ||
        (!transactionsResponse.success && transactionsResponse.error === 'Session expired. Please sign in again.')

      if (sessionExpired) {
        const sessionResponse = await apiClient.getCurrentUser()

        if (sessionResponse.success && sessionResponse.data?.user) {
          setUser(sessionResponse.data.user)
          setSessionVerified(true)
          return
        }

        logout()
        setSessionVerified(false)
        router.push('/login')
        return
      }

      if (balanceResponse.success && typeof balanceResponse.data?.balance === 'number') {
        setBalance(balanceResponse.data.balance)
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data?.transactions ?? [])
      }
    }

    void syncDashboardData()
  }, [hydrated, sessionVerified, logout, pathname, router, setBalance, setTransactions, setUser])

  const handleLogout = async () => {
    await apiClient.logout()
    setSessionVerified(false)
    logout()
    router.push('/')
  }

  if (!hydrated || !sessionVerified) {
    return null // or a loading spinner
  }

  const currentTitle = pageTitles[pathname] || 'Dashboard'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-2 px-6 py-4 border-b">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">FinPower</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">{currentTitle}</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
