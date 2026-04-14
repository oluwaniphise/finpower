'use client'

import Link from 'next/link'
import { useWalletStore } from '@/stores/wallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Wallet,
  CreditCard,
  Smartphone,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from 'lucide-react'
import { formatDate } from '../transactions/page'

const quickActions = [
  {
    title: 'Fund Wallet',
    description: 'Add money to your wallet',
    href: '/wallet/fund',
    icon: CreditCard,
    color: 'text-blue-600'
  },
  {
    title: 'Buy Airtime',
    description: 'Recharge your phone',
    href: '/bills/airtime',
    icon: Smartphone,
    color: 'text-green-600'
  },
  {
    title: 'Buy Data',
    description: 'Get data bundles',
    href: '/bills/data',
    icon: Smartphone,
    color: 'text-purple-600'
  },
  {
    title: 'Pay Electricity',
    description: 'Settle your bills',
    href: '/bills/electricity',
    icon: Zap,
    color: 'text-orange-600'
  }
]

export default function Dashboard() {
  const { balance, transactions } = useWalletStore()
  const recentTransactions = transactions.slice(0, 5)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-gray-600">Here&apos;s what&apos;s happening with your account today.</p>
      </div>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span>Wallet Balance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-3xl font-bold">
            {formatCurrency(balance)}
          </div>
          <p className="text-blue-100">Available for transactions</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              View All
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-gray-500">{transaction.category}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(transaction.date)}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
