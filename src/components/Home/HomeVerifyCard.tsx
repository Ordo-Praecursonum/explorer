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
import SurLogo from '@/components/SurLogo'

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
  | { kind: 'found'; match: Match; count: number }
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
      if (matches.length > 0) {
        setResult({ kind: 'found', match: matches[0], count: matches.length })
      } else {
        setResult({ kind: 'notfound' })
      }
    } catch {
      setResult({ kind: 'error' })
    }
  }

  return (
    <div
      className="sur-card relative overflow-hidden rounded-2xl p-6 sm:p-8"
      style={{
        background:
          'linear-gradient(135deg, #D9461E 0%, #F26419 55%, #FF9E40 100%)',
        boxShadow: colors.shadow.lg,
      }}
    >
      {/* soft decorative glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 animate-float"
        style={{
          background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center gap-3 mb-4">
        <SurLogo size={28} idSuffix="-home" />
        <span className="text-white/90 text-sm font-semibold tracking-wide uppercase">
          Verify content origin
        </span>
      </div>

      <h2 className="relative text-white text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        Was it written by a human?
      </h2>
      <p className="relative text-white/85 text-sm mb-5 max-w-xl">
        Paste any text — it's hashed in your browser and checked against
        on-chain proofs of human typing. Only the hash leaves your device.
      </p>

      <div className="relative flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur px-3 py-2 ring-1 ring-white/20 focus-within:ring-white/50 transition">
          <FiSearch className="text-white/80 shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verify()}
            placeholder="Paste text to verify…"
            className="w-full bg-transparent text-white placeholder-white/60 outline-none text-sm"
          />
        </div>
        <button
          onClick={verify}
          disabled={result.kind === 'loading' || !text.trim()}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-white/90 active:scale-95 transition disabled:opacity-60"
        >
          {result.kind === 'loading' ? 'Checking…' : 'Verify'}
        </button>
      </div>

      {/* compact result */}
      {result.kind === 'found' && (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-white animate-fade-up">
          <FiCheckCircle className="shrink-0" />
          <span className="text-sm font-medium">
            {claimText(result.match.origin)}
          </span>
        </div>
      )}
      {result.kind === 'notfound' && (
        <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-black/15 px-4 py-3 text-white animate-fade-up">
          <FiHelpCircle className="shrink-0" />
          <span className="text-sm font-medium">
            No attestation found — origin unverified.
          </span>
        </div>
      )}
      {result.kind === 'error' && (
        <div className="relative mt-4 text-white/90 text-sm animate-fade-up">
          Couldn't reach the chain. Is the node connected?
        </div>
      )}

      <Link
        to="/verify"
        className="relative mt-4 inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium group"
      >
        Open the full verifier
        <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

export default HomeVerifyCard
