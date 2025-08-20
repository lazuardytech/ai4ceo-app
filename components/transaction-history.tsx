'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { IconHistory } from '@tabler/icons-react';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/referral/transactions?page=${page}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      setError('Failed to load transaction history');
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  const formatAmount = (amount: string, type: string) => {
    const value = Number.parseFloat(amount);
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

    if (type === 'bonus_used') {
      return `-${formatted}`;
    }
    return `+${formatted}`;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'bonus_earned':
        return 'Bonus Earned';
      case 'bonus_used':
        return 'Bonus Used';
      case 'referral_signup':
        return 'Referral Signup';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'bonus_earned':
        return 'text-green-600';
      case 'bonus_used':
        return 'text-red-600';
      case 'referral_signup':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className={cn('border rounded-xl p-4', className)}>
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            Transaction History
          </h2>
          <span className="text-sm text-muted-foreground">
            Track your referral earnings and bonus usage.
          </span>
        </div>
        <div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-xl p-4', className)}>
      <div>
        <h2 className="flex items-center gap-2 font-medium">
          Transaction History
        </h2>
        <span className="text-sm text-muted-foreground">
          Track your referral earnings and bonus usage.
        </span>
      </div>
      <div className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="size-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {transactions.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconHistory className="size-10 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm">Your referral activity will appear here</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.amount !== '0' ? formatAmount(transaction.amount, transaction.type) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || isLoading}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore || isLoading}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
