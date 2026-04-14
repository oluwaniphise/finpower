'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const networks = [
  { id: 'mtn', name: 'MTN', color: 'bg-yellow-500', productCode: 'MTN', productItemCode: 'MTN_VTU' },
  { id: 'airtel', name: 'Airtel', color: 'bg-red-500', productCode: 'AIRTEL', productItemCode: 'AIRTEL_VTU' },
  { id: 'glo', name: 'Glo', color: 'bg-green-500', productCode: 'GLO', productItemCode: 'GLO_VTU' },
  { id: '9mobile', name: '9Mobile', color: 'bg-blue-500', productCode: '9MOBILE', productItemCode: '9MOBILE_VTU' },
]

const airtimeAmounts = [100, 200, 500, 1000, 2000, 5000]
const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
})

export default function BuyAirtime() {
  const user = useAuthStore((state) => state.user)
  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || user?.phone || '',
    network: '',
    amount: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const { balance, updateBalance, addTransaction } = useWalletStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(formData.amount)
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const selectedNetwork = networks.find((network) => network.id === formData.network)
    if (!selectedNetwork) {
      setError('Please select a network')
      return
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 11) {
      setError('Please enter a valid phone number')
      return
    }

    if (!user?.email) {
      setError('No email found for your account')
      return
    }

    if (numAmount > balance) {
      setError('Insufficient wallet balance')
      return
    }

    setIsProcessing(true)

    const response = await apiClient.buyAirtime({
      productCode: selectedNetwork.productCode,
      productItemCode: selectedNetwork.productItemCode,
      customerVendId: formData.phoneNumber,
      customerEmail: user.email,
      customerPhoneNumber: formData.phoneNumber,
      amount: numAmount,
    })

    if (!response.success) {
      setIsProcessing(false)
      setError(response.error || 'Unable to buy airtime')
      return
    }

    updateBalance(-numAmount)
    addTransaction({
      type: 'debit',
      amount: numAmount,
      description: `Airtime Purchase - ${selectedNetwork.name} for ${formData.phoneNumber}`,
      category: 'Airtime',
    })

    setIsProcessing(false)
    setIsSuccess(true)

    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Airtime Purchased!</h2>
              <p className="text-gray-600 mb-4">
                Successfully purchased {currencyFormatter.format(parseFloat(formData.amount))} airtime for {formData.phoneNumber}
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
        <h1 className="text-3xl font-bold text-gray-900">Buy Airtime</h1>
        <p className="text-gray-600 mt-1">Recharge your phone instantly</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Airtime Details</CardTitle>
          <CardDescription>Enter the details for your airtime purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Enter phone number (e.g., 08012345678)"
                value={formData.phoneNumber}
                onChange={handleChange}
                maxLength={11}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Network</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, network: network.id }))}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.network === network.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 ${network.color} rounded-full mx-auto mb-2`} />
                    <span className="text-sm font-medium">{network.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Amount</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {airtimeAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={formData.amount === amount.toString() ? 'default' : 'outline'}
                    onClick={() => setFormData((prev) => ({ ...prev, amount: amount.toString() }))}
                    className="h-12"
                  >
                    {currencyFormatter.format(amount)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customAmount">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                <Input
                  id="customAmount"
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wallet Balance:</span>
                <span className="font-semibold">{currencyFormatter.format(balance)}</span>
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
              disabled={isProcessing || !formData.phoneNumber || !formData.network || !formData.amount}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Buy Airtime - ${currencyFormatter.format(formData.amount ? parseFloat(formData.amount) : 0)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
