import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  date: string
  category: string
}

interface WalletState {
  balance: number
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void
  setTransactions: (transactions: Transaction[]) => void
  setBalance: (balance: number) => void
  updateBalance: (amount: number) => void
  fundWallet: (amount: number) => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 25000.50, // Mock balance
      transactions: [],

      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
        }
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }))
      },

      setTransactions: (transactions) => {
        set({
          transactions,
        })
      },

      setBalance: (balance) => {
        set({
          balance,
        })
      },

      updateBalance: (amount) => {
        set((state) => ({
          balance: state.balance + amount,
        }))
      },

      fundWallet: (amount) => {
        set((state) => ({
          balance: state.balance + amount,
        }))
        get().addTransaction({
          type: 'credit',
          amount,
          description: 'Wallet Funding',
          category: 'Funding',
        })
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
)
