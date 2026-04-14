'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletStore } from '@/stores/wallet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, Loader2, CheckCircle, AlertCircle, Wifi } from 'lucide-react'

const networks = [
  { id: 'mtn', name: 'MTN', color: 'bg-yellow-500' },
  { id: 'airtel', name: 'Airtel', color: 'bg-red-500' },
  { id: 'glo', name: 'Glo', color: 'bg-green-500' },
  { id: '9mobile', name: '9Mobile', color: 'bg-blue-500' }
]

const dataPlans = [
  { id: '1', name: '500MB', amount: 200, duration: '30 days' },
  { id: '2', name: '1GB', amount: 300, duration: '30 days' },
  { id: '3', name: '2GB', amount: 500, duration: '30 days' },
  { id: '4', name: '5GB', amount: 1000, duration: '30 days' },
  { id: '5', name: '10GB', amount: 1800, duration: '30 days' },
  { id: '6', name: '20GB', amount: 3500, duration: '30 days' }
]

export default function BuyData() {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    network: '',
    planId: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const { balance, updateBalance, addTransaction } = useWalletStore()
  const router = useRouter()

  const selectedPlan = dataPlans.find(p => p.id === formData.planId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPlan) {
      setError('Please select a data plan')
      return
    }

    if (!formData.network) {
      setError('Please select a network')
      return
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 11) {
      setError('Please enter a valid phone number')
      return
    }

    if (selectedPlan.amount > balance) {
      setError('Insufficient wallet balance')
      return
    }

    setIsProcessing(true)

    // Simulate data purchase
    setTimeout(() => {
      updateBalance(-selectedPlan.amount)
      addTransaction({
        type: 'debit',
        amount: selectedPlan.amount,
        description: `Data Bundle - ${selectedPlan.name} for ${formData.phoneNumber}`,
        category: 'Data'
      })

      setIsProcessing(false)
      setIsSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Data Purchased!</h2>
              <p className="text-gray-600 mb-4">
                Successfully purchased {selectedPlan?.name} data bundle for {formData.phoneNumber}
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
        <h1 className="text-3xl font-bold text-gray-900">Buy Data</h1>
        <p className="text-gray-600 mt-1">Get data bundles for your mobile device</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Bundle Details</CardTitle>
          <CardDescription>Choose your preferred data plan and network</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
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

            {/* Network Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Network</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, network: network.id }))}
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

            {/* Data Plans */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Data Plan</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, planId: plan.id }))}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      formData.planId === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Wifi className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-semibold">{plan.name}</div>
                          <div className="text-sm text-gray-500">{plan.duration}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₦{plan.amount}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Balance Check */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wallet Balance:</span>
                <span className="font-semibold">₦{balance.toLocaleString()}</span>
              </div>
              {selectedPlan && selectedPlan.amount > balance && (
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
              disabled={isProcessing || !formData.phoneNumber || !formData.network || !formData.planId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : selectedPlan ? (
                `Buy Data - ₦${selectedPlan.amount.toLocaleString()}`
              ) : (
                'Select a plan to continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}