import React, { useState } from 'react'
import {
  FiShield,
  FiCheckCircle,
  FiHelpCircle,
  FiLoader,
  FiAlertTriangle,
  FiHash,
  FiUser,
  FiClock,
} from 'react-icons/fi'
import { useTheme } from '@/theme/ThemeProvider'
import { config } from '@/config'

// One attestation as returned by the LCD endpoint. Cosmos encodes `bytes` as
// base64 in JSON, so nullifier / commitment_root arrive base64-encoded.
interface AttestationMatch {
  username: string
  nullifier: string
  commitment_root: string
  timestamp: string
  origin?: string
  citation?: string
}

// The honest claim each origin represents. Only human_keyboard asserts a human
// actually typed the content; the rest are device-signed declarations.
function originClaim(origin?: string): { label: string; human: boolean } {
  switch (origin) {
    case undefined:
    case '':
    case 'human_keyboard':
      return { label: 'Typed by a human on the Sur Keyboard', human: true }
    case 'device_authored':
      return {
        label: 'Authored on this device — typing not verified',
        human: false,
      }
    case 'ai_generated':
      return { label: 'Declared AI-generated', human: false }
    case 'external_source':
      return { label: 'Quoted from an external source', human: false }
    case 'imported':
      return { label: 'Imported / other origin', human: false }
    case 'ai_agent':
      return { label: 'Produced by an AI agent', human: false }
    default:
      return { label: `Origin: ${origin}`, human: false }
  }
}

// The signer's identity is an AI agent (surai1…) or a device (surdev1…).
function identityLabel(origin?: string): string {
  return origin === 'ai_agent' ? 'Agent' : 'Device'
}

interface VerifyResponse {
  found: boolean
  content_hash: string
  attestations: AttestationMatch[]
}

type Mode = 'text' | 'hash' | 'device'

type Verdict =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'verified'; hash: string; matches: AttestationMatch[] }
  | { kind: 'unverified'; hash: string }
  // device-scoped checks
  | {
      kind: 'deviceMatch'
      hash: string
      deviceId: string
      match: AttestationMatch
    }
  | { kind: 'deviceMismatch'; hash: string; deviceId: string; count: number }
  | { kind: 'error'; message: string }

const HASH_RE = /^(0x)?[0-9a-fA-F]{64}$/
const DEVICE_RE = /^surdev1[0-9a-z]{6,}$/

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function shorten(s: string, head = 10, tail = 6): string {
  if (s.length <= head + tail + 1) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

function formatTimestamp(unix: string): string {
  const secs = Number(unix)
  if (!secs) return 'unknown time'
  return new Date(secs * 1000).toLocaleString()
}

const VerifyOrigin: React.FC = () => {
  const { colors } = useTheme()
  const [mode, setMode] = useState<Mode>('text')
  const [input, setInput] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [verdict, setVerdict] = useState<Verdict>({ kind: 'idle' })

  const canSubmit =
    input.trim().length > 0 &&
    (mode === 'text' ||
      (mode === 'hash' && HASH_RE.test(input.trim())) ||
      (mode === 'device' && DEVICE_RE.test(deviceId.trim().toLowerCase()))) &&
    verdict.kind !== 'loading'

  const handleVerify = async () => {
    setVerdict({ kind: 'loading' })
    try {
      const hash =
        mode === 'hash'
          ? input.trim().replace(/^0x/, '').toLowerCase()
          : await sha256Hex(input)

      const url = `${config.restBase}/surprotocol/surchain/attestation/v1/verify/${hash}`
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(
          `Chain returned ${res.status}. ${body.slice(0, 200) || 'Is the chain REST API reachable?'}`
        )
      }
      const data: VerifyResponse = await res.json()
      const matches = data.found ? (data.attestations ?? []) : []

      if (mode === 'device') {
        const wanted = deviceId.trim().toLowerCase()
        const hit = matches.find((m) => m.username.toLowerCase() === wanted)
        if (hit) {
          setVerdict({
            kind: 'deviceMatch',
            hash,
            deviceId: wanted,
            match: hit,
          })
        } else if (matches.length > 0) {
          setVerdict({
            kind: 'deviceMismatch',
            hash,
            deviceId: wanted,
            count: matches.length,
          })
        } else {
          setVerdict({ kind: 'unverified', hash })
        }
        return
      }

      if (matches.length > 0) {
        setVerdict({ kind: 'verified', hash, matches })
      } else {
        setVerdict({ kind: 'unverified', hash })
      }
    } catch (err) {
      setVerdict({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <FiShield
            className="w-5 h-5"
            style={{ color: colors.text.inverse }}
          />
        </div>
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          Verify Content Origin
        </h1>
      </div>
      <p className="mb-6 text-sm" style={{ color: colors.text.secondary }}>
        Paste a piece of text to check whether it was typed by a human on the
        Sur Keyboard. The text is hashed locally in your browser — only its
        SHA-256 hash is sent to the chain — and matched against on-chain
        human-typing attestations.
      </p>

      {/* Input card */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border.primary}`,
          boxShadow: colors.shadow.sm,
        }}
      >
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {(['text', 'hash', 'device'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setVerdict({ kind: 'idle' })
              }}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  mode === m ? colors.primary : colors.backgroundSecondary,
                color: mode === m ? colors.text.inverse : colors.text.secondary,
              }}
            >
              {m === 'text'
                ? 'Paste text'
                : m === 'hash'
                  ? 'Paste hash'
                  : 'Text + device'}
            </button>
          ))}
        </div>

        {mode === 'hash' ? (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x… (64 hex chars — SHA-256 of the content)"
            className="w-full rounded-lg p-3 text-sm font-mono outline-none"
            style={{
              backgroundColor: colors.background,
              color: colors.text.primary,
              border: `1px solid ${colors.border.secondary}`,
            }}
          />
        ) : (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the text whose origin you want to verify…"
            rows={6}
            className="w-full rounded-lg p-3 text-sm font-mono resize-y outline-none"
            style={{
              backgroundColor: colors.background,
              color: colors.text.primary,
              border: `1px solid ${colors.border.secondary}`,
            }}
          />
        )}

        {/* Device id field — only in "Text + device" mode */}
        {mode === 'device' && (
          <input
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="surdev1… (the device id to check)"
            className="w-full rounded-lg p-3 mt-3 text-sm font-mono outline-none"
            style={{
              backgroundColor: colors.background,
              color: colors.text.primary,
              border: `1px solid ${colors.border.secondary}`,
            }}
          />
        )}

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            {mode === 'hash'
              ? HASH_RE.test(input.trim()) || input.length === 0
                ? 'SHA-256 hex'
                : 'Expected 64 hex characters'
              : mode === 'device'
                ? deviceId.length === 0 ||
                  DEVICE_RE.test(deviceId.trim().toLowerCase())
                  ? `${input.length} characters`
                  : 'Enter a valid surdev1… device id'
                : `${input.length} characters`}
          </span>
          <button
            onClick={handleVerify}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-opacity"
            style={{
              backgroundColor: colors.primary,
              color: colors.text.inverse,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {verdict.kind === 'loading' && (
              <FiLoader className="w-4 h-4 animate-spin" />
            )}
            Verify
          </button>
        </div>
      </div>

      {/* Result */}
      {verdict.kind === 'verified' &&
        (() => {
          const allHuman = verdict.matches.every(
            (m) => originClaim(m.origin).human
          )
          return (
            <ResultCard
              color={allHuman ? colors.status.success : colors.status.info}
              icon={<FiCheckCircle className="w-6 h-6" />}
              title={
                allHuman
                  ? 'Human-typed on Sur Keyboard'
                  : 'Recorded on the Sur Chain'
              }
              subtitle={
                allHuman
                  ? 'A zero-knowledge proof confirms this exact text was typed by a human (typing dynamics passed the human-likeness threshold) on a registered Sur device.'
                  : 'This content is recorded on the Sur Chain, but NOT as human-typed. Each entry below shows what the device actually claims — a declaration is signed by the device, but does not certify a human typed it.'
              }
              colors={colors}
            >
              <HashRow
                label="Content hash"
                value={verdict.hash}
                colors={colors}
              />
              <div className="mt-3 space-y-3">
                {verdict.matches.map((m, i) => {
                  const claim = originClaim(m.origin)
                  return (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{
                        backgroundColor: colors.background,
                        border: `1px solid ${claim.human ? colors.status.success : colors.border.primary}`,
                      }}
                    >
                      <Field
                        icon={
                          claim.human ? (
                            <FiCheckCircle className="w-4 h-4" />
                          ) : (
                            <FiHelpCircle className="w-4 h-4" />
                          )
                        }
                        label="Claim"
                        value={claim.label}
                        colors={colors}
                      />
                      {m.citation && (
                        <Field
                          icon={<FiHash className="w-4 h-4" />}
                          label="Source"
                          value={m.citation}
                          colors={colors}
                        />
                      )}
                      <Field
                        icon={<FiUser className="w-4 h-4" />}
                        label={identityLabel(m.origin)}
                        value={shorten(m.username, 14, 8)}
                        mono
                        colors={colors}
                      />
                      <Field
                        icon={<FiClock className="w-4 h-4" />}
                        label="Attested"
                        value={formatTimestamp(m.timestamp)}
                        colors={colors}
                      />
                    </div>
                  )
                })}
              </div>
            </ResultCard>
          )
        })()}

      {verdict.kind === 'deviceMatch' &&
        (() => {
          const claim = originClaim(verdict.match.origin)
          return (
            <ResultCard
              color={claim.human ? colors.status.success : colors.status.info}
              icon={<FiCheckCircle className="w-6 h-6" />}
              title={
                claim.human ? 'Typed by this device' : 'Attested by this device'
              }
              subtitle={
                claim.human
                  ? 'This exact text was typed by a human on the specified Sur device — confirmed by a zero-knowledge proof on the Sur Chain.'
                  : 'The specified device attested this content on the Sur Chain — see its claim below. This is a device-signed declaration, not a proof that a human typed it.'
              }
              colors={colors}
            >
              <HashRow
                label="Content hash"
                value={verdict.hash}
                colors={colors}
              />
              <div
                className="rounded-lg p-3 mt-3"
                style={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border.primary}`,
                }}
              >
                <Field
                  icon={
                    claim.human ? (
                      <FiCheckCircle className="w-4 h-4" />
                    ) : (
                      <FiHelpCircle className="w-4 h-4" />
                    )
                  }
                  label="Claim"
                  value={claim.label}
                  colors={colors}
                />
                {verdict.match.citation && (
                  <Field
                    icon={<FiHash className="w-4 h-4" />}
                    label="Source"
                    value={verdict.match.citation}
                    colors={colors}
                  />
                )}
                <Field
                  icon={<FiUser className="w-4 h-4" />}
                  label={identityLabel(verdict.match.origin)}
                  value={verdict.deviceId}
                  mono
                  colors={colors}
                />
                <Field
                  icon={<FiClock className="w-4 h-4" />}
                  label="Attested"
                  value={formatTimestamp(verdict.match.timestamp)}
                  colors={colors}
                />
              </div>
            </ResultCard>
          )
        })()}

      {verdict.kind === 'deviceMismatch' && (
        <ResultCard
          color={colors.status.warning}
          icon={<FiHelpCircle className="w-6 h-6" />}
          title="Not from this device"
          subtitle={`This content is attested on the Sur Chain by ${verdict.count} device${verdict.count === 1 ? '' : 's'}, but none of them is the device id you entered. The content is human-typed — just not by that device.`}
          colors={colors}
        >
          <HashRow label="Content hash" value={verdict.hash} colors={colors} />
          <HashRow
            label="Checked device"
            value={verdict.deviceId}
            colors={colors}
          />
        </ResultCard>
      )}

      {verdict.kind === 'unverified' && (
        <ResultCard
          color={colors.status.warning}
          icon={<FiHelpCircle className="w-6 h-6" />}
          title="Origin unverified"
          subtitle="No human-typing attestation exists for this content on the Sur Chain. It may have been pasted, generated by AI, edited after typing, or simply never attested via Sur. Absence of a proof is not proof of AI — it only means Sur cannot vouch for it."
          colors={colors}
        >
          <HashRow label="Content hash" value={verdict.hash} colors={colors} />
        </ResultCard>
      )}

      {verdict.kind === 'error' && (
        <ResultCard
          color={colors.status.error}
          icon={<FiAlertTriangle className="w-6 h-6" />}
          title="Could not verify"
          subtitle={verdict.message}
          colors={colors}
        />
      )}

      {/* What this means */}
      <div
        className="rounded-xl p-5 mt-6 text-sm"
        style={{
          backgroundColor: colors.backgroundSecondary,
          color: colors.text.secondary,
        }}
      >
        <p
          className="font-semibold mb-2"
          style={{ color: colors.text.primary }}
        >
          How this works
        </p>
        <p>
          When a user types on the Sur Keyboard, the device measures typing
          dynamics (inter-keystroke timing, key coordinates, rhythm) and
          produces a zero-knowledge proof that the behaviour matches a human —
          without revealing the keystrokes themselves. The proof is bound to the
          content hash and recorded on the Sur Chain. A match here means that
          proof exists; the underlying timing data stays private.
        </p>
      </div>
    </div>
  )
}

// --- presentational helpers ---

interface Colors {
  // narrow structural type for the theme palette we use here
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  border: { primary: string; secondary: string; focus: string }
  surface: string
  background: string
  backgroundSecondary: string
  primary: string
  shadow: { sm: string; md: string; lg: string }
  status: { success: string; warning: string; error: string; info: string }
}

const ResultCard: React.FC<{
  color: string
  icon: React.ReactNode
  title: string
  subtitle: string
  colors: Colors
  children?: React.ReactNode
}> = ({ color, icon, title, subtitle, colors, children }) => (
  <div
    className="rounded-xl p-5"
    style={{
      backgroundColor: colors.surface,
      border: `1px solid ${color}`,
      boxShadow: colors.shadow.sm,
    }}
  >
    <div className="flex items-start gap-3">
      <span style={{ color }}>{icon}</span>
      <div className="flex-1">
        <h2 className="text-lg font-bold" style={{ color }}>
          {title}
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
          {subtitle}
        </p>
      </div>
    </div>
    {children && <div className="mt-4">{children}</div>}
  </div>
)

const HashRow: React.FC<{ label: string; value: string; colors: Colors }> = ({
  label,
  value,
  colors,
}) => (
  <div
    className="rounded-lg p-3 flex items-center gap-2"
    style={{
      backgroundColor: colors.background,
      border: `1px solid ${colors.border.primary}`,
    }}
  >
    <FiHash className="w-4 h-4" style={{ color: colors.text.tertiary }} />
    <span className="text-xs" style={{ color: colors.text.tertiary }}>
      {label}:
    </span>
    <span
      className="text-xs font-mono break-all"
      style={{ color: colors.text.secondary }}
    >
      {value}
    </span>
  </div>
)

const Field: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  colors: Colors
}> = ({ icon, label, value, mono, colors }) => (
  <div className="flex items-center gap-2 py-1">
    <span style={{ color: colors.text.tertiary }}>{icon}</span>
    <span
      className="text-xs w-20 shrink-0"
      style={{ color: colors.text.tertiary }}
    >
      {label}
    </span>
    <span
      className={`text-sm ${mono ? 'font-mono' : 'font-medium'}`}
      style={{ color: colors.text.primary }}
    >
      {value}
    </span>
  </div>
)

export default VerifyOrigin
