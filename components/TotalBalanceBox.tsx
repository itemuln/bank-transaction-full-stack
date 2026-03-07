import React from 'react'
import { formatAmount } from '@/lib/utils'

interface Account {
    name: string;
    currentBalance: number;
    mask?: string;
}

interface TotalBalanceBoxProps {
    accounts: Account[];
    totalBanks: number;
    totalCurrentBalance: number;
}

const TotalBalanceBox = ({
    totalBanks, totalCurrentBalance
}: TotalBalanceBoxProps) => {
  return (
    <section className='total-balance'>
        <div className='total-balance-chart'>
            {/* Doughnut Chart - placeholder */}
            <div className="relative size-full rounded-full border-8 border-white/30 bg-white/10 backdrop-blur">
                <div className="absolute inset-0 flex-center">
                    <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
        </div>
        <div className='flex flex-col gap-6'>
            <h2 className='header-2'>
                Bank Accounts: {totalBanks}
            </h2>
            <div className='flex flex-col gap-2'>
                <p className='total-balance-label'>
                    Total Current Balance
                </p>
                <p className='total-balance-amount flex-center gap-2'>
                    {formatAmount(totalCurrentBalance)}
                </p>

            </div>

        </div>
    </section>
  )
}

export default TotalBalanceBox