import { useEffect, useRef, useState } from 'react'
import { sendSupportMessage, subscribeSupportMessages } from '../firebase/db'
import type { SupportChatMessage } from '../types'

type Props = {
  tenantId: string
  studentId: string
  viewerRole: 'student' | 'tenant'
  myUid: string
  myName: string
  peerLabel: string
}

export default function SupportChatPanel({ tenantId, studentId, viewerRole, myUid, myName, peerLabel }: Props) {
  const [messages, setMessages] = useState<SupportChatMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribeSupportMessages(tenantId, studentId, setMessages)
  }, [tenantId, studentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    try {
      await sendSupportMessage(tenantId, studentId, {
        senderRole: viewerRole,
        senderUid: myUid,
        senderName: myName,
        text: t,
      })
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[min(70vh,560px)] flex-col rounded-2xl border border-white/10 bg-[#0f141c]">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white">{peerLabel}</p>
        <p className="text-[10px] uppercase tracking-widest text-emerald-400">● Aktif</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-500">Belum ada pesan. Mulai percakapan.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderUid === myUid
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-[var(--accent)]/25 text-zinc-100' : 'bg-[#1a222c] text-zinc-200'
                }`}
              >
                {!mine && <p className="mb-1 text-[10px] font-semibold text-[var(--accent)]">{m.senderName}</p>}
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={viewerRole === 'tenant' ? 'Balas pelanggan…' : 'Kirim ke dapur tenant…'}
            className="flex-1 rounded-xl border border-white/10 bg-[#0b0e11] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]/40"
          />
          <button
            type="button"
            disabled={sending || !text.trim()}
            onClick={() => void send()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[#0b0e11] disabled:opacity-40"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  )
}
