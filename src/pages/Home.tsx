import React from 'react'
import { useTheme } from '@/theme/ThemeProvider'
import { FiBox, FiUsers, FiClock, FiActivity } from 'react-icons/fi'
import { useHomeData } from '@/hooks/useHomeData'
import StatCard from '@/components/Home/StatCard'
import RecentBlocksCard from '@/components/Home/RecentBlocksCard'
import RecentTransactionsCard from '@/components/Home/RecentTransactionsCard'
import QuickActionsCard from '@/components/Home/QuickActionsCard'
import HomeVerifyCard from '@/components/Home/HomeVerifyCard'

const Home: React.FC = () => {
  const { colors } = useTheme()
  const {
    isConnected,
    isLoading,
    latestBlock,
    totalTransactions,
    blockTime,
    totalActiveValidator,
  } = useHomeData()

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="animate-fade-up">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-1"
          style={{ color: colors.text.primary }}
        >
          Sur Scanner
        </h1>
        <p
          className="text-base sm:text-lg"
          style={{ color: colors.text.secondary }}
        >
          Explore the Sur Chain and verify the human origin of content.
        </p>
      </div>

      {/* Verify origin — front and centre */}
      <div className="animate-fade-up-1">
        <HomeVerifyCard />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up-2">
        <StatCard
          title="Latest Block"
          value={
            isConnected
              ? latestBlock !== null
                ? latestBlock
                : ''
              : 'Not Connected'
          }
          icon={FiBox}
          subtitle="Current height"
          iconColor={colors.status.info}
          isLoading={isConnected && latestBlock === null}
        />
        <StatCard
          title="Active Validators"
          value={!isLoading ? totalActiveValidator : 'Loading'}
          icon={FiUsers}
          subtitle="Currently active"
          iconColor={colors.status.success}
        />
        <StatCard
          title="Total Transactions"
          value={isConnected ? totalTransactions : 'Not Connected'}
          icon={FiActivity}
          subtitle="Transaction count"
          iconColor={colors.primary}
        />
        <StatCard
          title="Block Time"
          value={isConnected ? blockTime : 'Not Connected'}
          icon={FiClock}
          subtitle="Latest interval"
          iconColor={colors.status.warning}
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-up-3">
        <RecentBlocksCard />
        <RecentTransactionsCard />
      </div>

      {/* Quick actions */}
      <div className="animate-fade-up-3">
        <QuickActionsCard isConnected={isConnected} />
      </div>
    </div>
  )
}

export default Home
