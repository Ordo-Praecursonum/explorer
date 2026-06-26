import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiSearch,
  FiArrowRight,
  FiCheckCircle,
  FiHelpCircle,
} from 'react-icons/fi'
import { useTheme } from '@/theme/ThemeProvider'
import { config } from '@/config'

interface Match {
  username: string
  origin?: string
}

function claimText(origin?: string): string {
  switch (origin) {
    case undefined:
    case '':
    case 'human_keyboard':
      return 'Typed by a human on the Sur Keyboard'
    case 'device_authored':
      return 'Authored on a device — typing not verified'
    case 'ai_generated':
      return 'Declared AI-generated'
    case 'external_source':
      return 'Quoted from an external source'
    case 'imported':
      return 'Imported / other origin'
    case 'ai_agent':
      return 'Produced by an AI agent'
    default:
      return `Origin: ${origin}`
  }
}

type Result =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; match: Match }
  | { kind: 'notfound' }
  | { kind: 'error' }

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  )
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const HomeVerifyCard: React.FC = () => {
  const { colors } = useTheme()
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result>({ kind: 'idle' })

  const verify = async () => {
    if (!text.trim()) return
    setResult({ kind: 'loading' })
    try {
      const hash = await sha256Hex(text)
      const res = await fetch(
        `${config.restBase}/surprotocol/surchain/attestation/v1/verify/${hash}`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const matches: Match[] = data.found ? (data.attestations ?? []) : []
      setResult(
        matches.length > 0
          ? { kind: 'found', match: matches[0] }
          : { kind: 'notfound' }
      )
    } catch {
      setResult({ kind: 'error' })
    }
  }

  return (
    <div
      className="sur-card rounded-2xl p-6 sm:p-7"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border.primary}`,
        boxShadow: colors.shadow.sm,
      }}
    >
      <div className="flex items-start gap-4">
        <img
          src="/sur-logo.png"
          alt=""
          width={40}
          height={40}
          className="rounded-[11px] shrink-0 hidden sm:block"
        />
        <div className="min-w-0 flex-1">
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: colors.primary }}
          >
            Verify content origin
          </span>
          <h2
            className="text-xl sm:text-2xl font-semibold tracking-tight mt-1"
            style={{ color: colors.text.primary }}
          >
            Was it written by a human?
          </h2>
          <p
            className="text-sm mt-1.5 max-w-xl"
            style={{ color: colors.text.secondary }}
          >
            Paste any text — it's hashed in your browser and checked against
            on-chain proofs of human typing. Only the hash leaves your device.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
              style={{
                backgroundColor: colors.background,
                border: `1px solid ${colors.border.secondary}`,
              }}
            >
              <FiSearch
                className="shrink-0"
                style={{ color: colors.text.tertiary }}
              />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verify()}
                placeholder="Paste text to verify…"
                className="w-full bg-transparent outline-none text-sm"
                style={{ color: colors.text.primary }}
              />
            </div>
            <button
              onClick={verify}
              disabled={result.kind === 'loading' || !text.trim()}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {result.kind === 'loading' ? 'Checking…' : 'Verify'}
            </button>
          </div>

          {result.kind === 'found' && (
            <ResultPill
              icon={<FiCheckCircle />}
              text={claimText(result.match.origin)}
              color={colors.status.success}
            />
          )}
          {result.kind === 'notfound' && (
            <ResultPill
              icon={<FiHelpCircle />}
              text="No attestation found — origin unverified."
              color={colors.status.warning}
            />
          )}
          {result.kind === 'error' && (
            <ResultPill
              icon={<FiHelpCircle />}
              text="Couldn't reach the chain. Is the node connected?"
              color={colors.text.tertiary}
            />
          )}

          <Link
            to="/verify"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium group"
            style={{ color: colors.primary }}
          >
            Open the full verifier
            <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

const ResultPill: React.FC<{
  icon: React.ReactNode
  text: string
  color: string
}> = ({ icon, text, color }) => (
  <div
    className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium animate-fade-up"
    style={{ backgroundColor: color + '14', color }}
  >
    <span className="shrink-0">{icon}</span>
    {text}
  </div>
)

export default HomeVerifyCard
