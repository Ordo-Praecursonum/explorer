import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiActivity, FiArrowRight } from 'react-icons/fi'
import { useTheme } from '@/theme/ThemeProvider'
import { selectBlocks } from '@/store/streamSlice'
import { trimHash, timeFromNow } from '@/utils/helper'
import Empty from '@/components/Empty'

interface RecentTx {
  hash: string
  height: number
  time: string
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16)
  }
  return out
}

// Tendermint tx hash = uppercase hex of SHA-256(txBytes).
async function txHash(txHex: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', hexToBytes(txHex))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

const RecentTransactionsCard: React.FC = React.memo(() => {
  const { colors } = useTheme()
  const blocks = useSelector(selectBlocks)
  const [txs, setTxs] = useState<RecentTx[]>([])

  useEffect(() => {
    let cancelled = false
    const build = async () => {
      const collected: RecentTx[] = []
      for (const block of blocks) {
        const height = parseInt(block.header.height)
        const time = timeFromNow(block.header.time)
        for (const txHex of (block.txs as unknown as string[]) || []) {
          if (!txHex) continue
          try {
            collected.push({ hash: await txHash(txHex), height, time })
          } catch {
            /* skip undecodable tx */
          }
          if (collected.length >= 6) break
        }
        if (collected.length >= 6) break
      }
      if (!cancelled) setTxs(collected)
    }
    build()
    return () => {
      cancelled = true
    }
  }, [blocks])

  return (
    <div className="glass sur-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-xl font-bold tracking-tight"
          style={{ color: colors.text.primary }}
        >
          Latest Transactions
        </h3>
        <Link
          to="/txs"
          className="inline-flex items-center gap-1 text-sm font-medium group"
          style={{ color: colors.primary }}
        >
          View all
          <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {txs.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-2">
          {txs.map((tx, i) => (
            <Link
              key={tx.hash}
              to={`/txs/${tx.hash}`}
              className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors animate-fade-up-${Math.min(i, 3)}`}
              style={{ backgroundColor: colors.backgroundSecondary }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: colors.primary + '1a',
                    color: colors.primary,
                  }}
                >
                  <FiActivity className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p
                    className="font-mono text-sm truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {trimHash(tx.hash, 14)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.tertiary }}
                  >
                    Block #{tx.height}
                  </p>
                </div>
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: colors.text.secondary }}
              >
                {tx.time}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
})

RecentTransactionsCard.displayName = 'RecentTransactionsCard'

export default RecentTransactionsCard
