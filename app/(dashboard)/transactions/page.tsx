"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useWalletStore } from "@/stores/wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Receipt,
  CreditCard,
  Smartphone,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";

const categoryIcons = {
  Airtime: Smartphone,
  Data: Smartphone,
  Electricity: Zap,
  Funding: CreditCard,
  default: Receipt,
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Transactions() {
  const { transactions, setTransactions } = useWalletStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError("");

      const response = await apiClient.getMyTransactions();

      if (!response.success) {
        setError(response.error || "Unable to load transactions");
        setIsLoading(false);
        return;
      }

      setTransactions(response.data?.transactions ?? []);
      setIsLoading(false);
    };

    void loadTransactions();
  }, [setTransactions]);

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || transaction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Transaction History
        </h1>
        <p className="mt-1 text-gray-600">
          View and manage all your financial transactions
        </p>
      </div>

      {!isLoading && !error && transactions.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +
                  {formatCurrency(
                    transactions
                      .filter((t) => t.type === "credit")
                      .reduce((sum, t) => sum + t.amount, 0),
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">Total Credits</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  -
                  {formatCurrency(
                    transactions
                      .filter((t) => t.type === "debit")
                      .reduce((sum, t) => sum + t.amount, 0),
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">Total Debits</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Total Transactions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Loading transactions...</span>
            </div>
          ) : filteredTransactions.length > 0 ? (
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
                {filteredTransactions.map((transaction) => {
                  const Icon =
                    categoryIcons[
                      transaction.category as keyof typeof categoryIcons
                    ] || categoryIcons.default;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            transaction.type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gray-500" />
                          <span>{transaction.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {transaction.category}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-lg font-semibold ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Receipt className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No transactions found
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory
                  ? "Try adjusting your search or filter criteria"
                  : "Your transaction history will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
