'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useWalletStore } from '@/stores/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
  { id: 'bank', name: 'Bank Transfer', icon: CreditCard },
  { id: 'wallet', name: 'Mobile Wallet', icon: CreditCard }
]

export default function FundWallet() {
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const { balance, addTransaction, setBalance } = useWalletStore()
  const router = useRouter()

  useEffect(() => {
    const syncWalletBalance = async () => {
      const response = await apiClient.getWalletBalance()

      if (response.success && typeof response.data?.balance === 'number') {
        setBalance(response.data.balance)
      }
    }

    void syncWalletBalance()
  }, [setBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!selectedMethod) {
      setError('Please select a payment method')
      return
    }

    setIsProcessing(true)

    const description = `Wallet Funding - ${selectedMethod}`
    const response = await apiClient.creditWallet({
      amount: numAmount,
      desc: description,
    })

    if (!response.success) {
      setIsProcessing(false)
      setError(response.error || 'Unable to fund wallet')
      return
    }

    const nextBalance = response.data?.balance ?? balance + numAmount
    setBalance(nextBalance)
    addTransaction({
      type: 'credit',
      amount: numAmount,
      description,
      category: 'Funding',
    })

    setIsProcessing(false)
    setIsSuccess(true)

    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const quickAmounts = [1000, 2500, 5000, 10000]

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your wallet has been funded with {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: 'NGN'
                }).format(parseFloat(amount))}
              </p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fund Your Wallet</h1>
        <p className="text-gray-600 mt-1">Add money to your FinPower wallet instantly</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Amount</CardTitle>
          <CardDescription>Choose how much you&apos;d like to add to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm font-medium">Quick Amounts</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="h-12"
                  >
                    ₦{quickAmount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method</Label>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">{method.name}</span>
                      <div className="ml-auto">
                        <div className={`w-4 h-4 border-2 rounded-full ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedMethod === method.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isProcessing || !amount || !selectedMethod}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Fund Wallet - ₦${amount ? parseFloat(amount).toLocaleString() : '0.00'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Secure Payment</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your payment information is encrypted and secure. We use bank-level security to protect your transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
