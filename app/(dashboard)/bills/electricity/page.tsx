"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type BillServiceItem,
  type BillServiceProvider,
} from "@/lib/api-client";
import { useWalletStore } from "@/stores/wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap, Loader2, CheckCircle, AlertCircle, Search } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default function PayElectricity() {
  const [formData, setFormData] = useState({
    meterNumber: "",
    disco: "",
    productItemCode: "",
    amount: "",
    customerName: "",
    address: "",
  });
  const [discoProviders, setDiscoProviders] = useState<BillServiceProvider[]>(
    [],
  );
  const [serviceItems, setServiceItems] = useState<BillServiceItem[]>([]);
  const [isLoadingDiscos, setIsLoadingDiscos] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const { balance, updateBalance, addTransaction } = useWalletStore();
  const router = useRouter();

  const selectedDisco = discoProviders.find(
    (d) => String(d.id) === formData.disco,
  );
  const selectedServiceItem = serviceItems.find(
    (item) => item.code === formData.productItemCode,
  );

  useEffect(() => {
    let isActive = true;

    const loadDiscos = async () => {
      setIsLoadingDiscos(true);
      setError("");

      const response = await apiClient.getBillServiceProviders("ELECTRICITY");

      if (!isActive) {
        return;
      }

      if (!response.success) {
        setError(response.error || "Unable to load distribution companies");
        setDiscoProviders([]);
      } else {
        setDiscoProviders(response.data?.products ?? []);
      }

      setIsLoadingDiscos(false);
    };

    void loadDiscos();

    return () => {
      isActive = false;
    };
  }, []);

  const loadServiceItems = async (disco: BillServiceProvider) => {
    setIsLoadingItems(true);
    setError("");
    setServiceItems([]);
    setIsVerified(false);
    setFormData((prev) => ({
      ...prev,
      disco: String(disco.id),
      productItemCode: "",
      amount: "",
      customerName: "",
      address: "",
    }));

    const response = await apiClient.getBillServiceItems(disco.id);

    if (!response.success) {
      setError(
        response.error || `Unable to load ${disco.name} electricity products`,
      );
      setIsLoadingItems(false);
      return;
    }

    setServiceItems(response.data?.productItems ?? []);
    setIsLoadingItems(false);
  };

  const selectServiceItem = (item: BillServiceItem) => {
    setIsVerified(false);
    setFormData((prev) => ({
      ...prev,
      productItemCode: item.code,
      amount: item.isFixedAmount && item.amount > 0 ? String(item.amount) : "",
      customerName: "",
      address: "",
    }));
  };

  const handleVerifyMeter = async () => {
    if (!formData.meterNumber || !selectedDisco || !selectedServiceItem) {
      setError(
        "Please enter meter number, select a disco, and choose prepaid or postpaid",
      );
      return;
    }

    setIsVerifying(true);
    setError("");

    // Meter validation endpoint is not available yet, so this keeps the existing mock behavior.
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        customerName: "John Doe",
        address: "123 Example Street, Lagos",
      }));
      setIsVerified(true);
      setIsVerifying(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(formData.amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!selectedDisco || !selectedServiceItem) {
      setError("Please select a distribution company and electricity product");
      return;
    }

    if (
      selectedServiceItem.minAmount > 0 &&
      numAmount < selectedServiceItem.minAmount
    ) {
      setError(
        `Minimum amount is ${currencyFormatter.format(selectedServiceItem.minAmount)}`,
      );
      return;
    }

    if (
      selectedServiceItem.maxAmount > 0 &&
      numAmount > selectedServiceItem.maxAmount
    ) {
      setError(
        `Maximum amount is ${currencyFormatter.format(selectedServiceItem.maxAmount)}`,
      );
      return;
    }

    if (!isVerified) {
      setError("Please verify your meter first");
      return;
    }

    if (numAmount > balance) {
      setError("Insufficient wallet balance");
      return;
    }

    setIsProcessing(true);

    // Electricity payment endpoint is not available yet, so this keeps the existing mock behavior.
    setTimeout(() => {
      updateBalance(-numAmount);
      addTransaction({
        type: "debit",
        amount: numAmount,
        description: `Electricity Bill - ${selectedServiceItem.name} (${formData.meterNumber})`,
        category: "Electricity",
      });

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "meterNumber") {
      setIsVerified(false);
    }

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-4">
                Successfully paid{" "}
                {currencyFormatter.format(parseFloat(formData.amount))} for
                electricity bill
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Pay Electricity Bill
        </h1>
        <p className="text-gray-600 mt-1">
          Settle your electricity bills quickly and securely
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Payment Details</CardTitle>
          <CardDescription>
            Enter your meter details to pay your electricity bill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select Distribution Company
              </Label>
              {isLoadingDiscos ? (
                <div className="flex items-center text-sm text-gray-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading distribution companies...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {discoProviders.map((disco) => (
                    <button
                      key={disco.id}
                      type="button"
                      onClick={() => void loadServiceItems(disco)}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        formData.disco === String(disco.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-semibold">{disco.name}</div>
                          <div className="text-sm text-gray-500">
                            {disco.code}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(formData.disco || isLoadingItems) && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Meter Type</Label>
                {isLoadingItems ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading electricity products...
                  </div>
                ) : serviceItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {serviceItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectServiceItem(item)}
                        className={`p-4 border-2 rounded-lg transition-all text-left ${
                          formData.productItemCode === item.code
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-semibold">{item.name}</div>
                        <div className="mt-1 text-sm text-gray-500">
                          {item.isFixedAmount
                            ? currencyFormatter.format(item.amount)
                            : `${currencyFormatter.format(item.minAmount)} - ${currencyFormatter.format(item.maxAmount)}`}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No electricity products found for this distribution company.
                  </p>
                )}
              </div>
            )}

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
                  disabled={
                    isVerifying ||
                    !formData.meterNumber ||
                    !selectedDisco ||
                    !selectedServiceItem
                  }
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

            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Meter Verified</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Customer Name:</span>{" "}
                    {formData.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {formData.address}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Pay</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₦
                </span>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="pl-8"
                  min={selectedServiceItem?.minAmount || 1}
                  max={selectedServiceItem?.maxAmount || undefined}
                  readOnly={selectedServiceItem?.isFixedAmount}
                />
              </div>
              {selectedServiceItem && !selectedServiceItem.isFixedAmount && (
                <p className="text-sm text-gray-500">
                  Allowed amount:{" "}
                  {currencyFormatter.format(selectedServiceItem.minAmount)} to{" "}
                  {currencyFormatter.format(selectedServiceItem.maxAmount)}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wallet Balance:</span>
                <span className="font-semibold">
                  {currencyFormatter.format(balance)}
                </span>
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
              disabled={
                isProcessing ||
                !isVerified ||
                !formData.amount ||
                !selectedServiceItem
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay Bill - ${currencyFormatter.format(formData.amount ? parseFloat(formData.amount) : 0)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
