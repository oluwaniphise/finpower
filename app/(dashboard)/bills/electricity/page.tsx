'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletStore } from '@/stores/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react'

const discoProviders = [
  { id: 'ikedc', name: 'Ikeja Electric (IKEDC)', code: '01' },
  { id: 'ekedc', name: 'Eko Electric (EKEDC)', code: '02' },
  { id: 'kedco', name: 'Kano Electric (KEDCO)', code: '03' },
  { id: 'phed', name: 'Port Harcourt Electric (PHED)', code: '04' },
  { id: 'jed', name: 'Jos Electric (JED)', code: '05' },
  { id: 'ibedc', name: 'Ibadan Electric (IBEDC)', code: '06' }
]

export default function PayElectricity() {
  const [formData, setFormData] = useState({
    meterNumber: '',
    disco: '',
    amount: '',
    customerName: '',
    address: ''
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const { balance, updateBalance, addTransaction } = useWalletStore()
  const router = useRouter()

  const selectedDisco = discoProviders.find(d => d.id === formData.disco)

  const handleVerifyMeter = async () => {
    if (!formData.meterNumber || !formData.disco) {
      setError('Please enter meter number and select a disco')
      return
    }

    setIsVerifying(true)
    setError('')

    // Simulate meter verification
    setTimeout(() => {
      // Mock customer data
      setFormData(prev => ({
        ...prev,
        customerName: 'John Doe',
        address: '123 Example Street, Lagos'
      }))
      setIsVerified(true)
      setIsVerifying(false)
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(formData.amount)
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!isVerified) {
      setError('Please verify your meter first')
      return
    }

    if (numAmount > balance) {
      setError('Insufficient wallet balance')
      return
    }

    setIsProcessing(true)

    // Simulate electricity bill payment
    setTimeout(() => {
      updateBalance(-numAmount)
      addTransaction({
        type: 'debit',
        amount: numAmount,
        description: `Electricity Bill - ${selectedDisco?.name} (${formData.meterNumber})`,
        category: 'Electricity'
      })

      setIsProcessing(false)
      setIsSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                Successfully paid ₦{parseFloat(formData.amount).toLocaleString()} for electricity bill
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
        <h1 className="text-3xl font-bold text-gray-900">Pay Electricity Bill</h1>
        <p className="text-gray-600 mt-1">Settle your electricity bills quickly and securely</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Payment Details</CardTitle>
          <CardDescription>Enter your meter details to pay your electricity bill</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Disco Selection */}
            <div className="space-y-2">
              <Label htmlFor="disco">Select Distribution Company</Label>
              <select
                id="disco"
                name="disco"
                value={formData.disco}
                onChange={handleChange}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Choose your disco...</option>
                {discoProviders.map((disco) => (
                  <option key={disco.id} value={disco.id}>
                    {disco.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Meter Number */}
            <div className="space-y-2">
              <Label htmlFor="meterNumber">Meter Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="meterNumber"
                  name="meterNumber"
                  type="text"
                  placeholder="Enter your meter number"
                  value={formData.meterNumber}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  onClick={handleVerifyMeter}
                  disabled={isVerifying || !formData.meterNumber || !formData.disco}
                  variant="outline"
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Customer Details (shown after verification) */}
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Meter Verified</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Customer Name:</span> {formData.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {formData.address}
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Pay</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-8"
                  min="1"
                />
              </div>
            </div>

            {/* Balance Check */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wallet Balance:</span>
                <span className="font-semibold">₦{balance.toLocaleString()}</span>
              </div>
              {formData.amount && parseFloat(formData.amount) > balance && (
                <div className="flex items-center space-x-2 mt-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Insufficient balance</span>
                </div>
              )}
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
              disabled={isProcessing || !isVerified || !formData.amount}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay Bill - ₦${formData.amount ? parseFloat(formData.amount).toLocaleString() : '0'}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}