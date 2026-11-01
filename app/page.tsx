'use client'

import { FormEvent, useState } from 'react'
import { ArrowUpRight, Check, Globe2, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react'

interface SiteData {
  url: string
  domain: string
  title: string
  description: string
  status: number
  statusText: string
  contentType: string
  server: string
  language: string
  indexed: string
  hasHttps: boolean
}

const examples = ['stripe.com', 'linear.app', 'notion.so']

export default function Page() {
  const [url, setUrl] = useState('')
  const [site, setSite] = useState<SiteData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function inspectSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSite(null)
    setLoading(true)

    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'We could not inspect that address.')
      setSite(data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f5] text-[#15231c]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(175,215,188,0.42),transparent_30%),radial-gradient(circle_at_8%_45%,rgba(232,218,178,0.32),transparent_25%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between py-6">
          <a href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight" aria-label="Sitecheck home">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#173b2a] text-[#d8f4df]"><Globe2 className="size-4" /></span>
            sitecheck<span className="text-[#789683]">/</span>
          </a>
          <div className="hidden items-center gap-2 text-xs text-[#6c7d71] sm:flex"><ShieldCheck className="size-4" /> Safe, read-only inspection</div>
        </header>

        <section className="flex flex-1 flex-col items-center pt-16 text-center sm:pt-24">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#cbdccf] bg-white/65 px-3.5 py-1.5 text-xs font-medium text-[#50705c] shadow-sm">
            <Sparkles className="size-3.5" /> Make sense of any website
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-7xl">What&apos;s behind the link?</h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[#65766b] sm:text-lg">Paste a website address and get a quick, useful read on what it is, who it&apos;s for, and how it&apos;s built.</p>

          <form onSubmit={inspectSite} className="mt-10 w-full max-w-2xl">
            <label htmlFor="website-url" className="sr-only">Website address</label>
            <div className="flex flex-col gap-2 rounded-2xl border border-[#cbd8cd] bg-white p-2 shadow-[0_14px_40px_rgba(41,76,55,0.10)] sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3"><Search className="size-5 shrink-0 text-[#91a79a]" /><input id="website-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#a0aea4]" /></div>
              <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#173b2a] px-5 text-sm font-semibold text-white transition hover:bg-[#24543b] disabled:cursor-wait disabled:opacity-70">{loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}{loading ? 'Reading site...' : 'Inspect website'}</button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-[#799082]"><span className="mr-1">Try</span>{examples.map((example) => <button key={example} type="button" onClick={() => setUrl(`https://${example}`)} className="rounded-full border border-[#d5e0d7] bg-white/50 px-2.5 py-1 transition hover:border-[#9ab8a2] hover:text-[#315c41]">{example}</button>)}</div>
          </form>

          {error && <div role="alert" className="mt-8 rounded-xl border border-[#e8caca] bg-[#fff7f7] px-4 py-3 text-sm text-[#9b4f4f]">{error}</div>}
          {site && <ResultCard site={site} />}
        </section>
        <footer className="flex justify-between border-t border-[#dce5dd] py-5 text-xs text-[#8a9a90]"><span>Built for curious clicks.</span><span>Headers + page metadata</span></footer>
      </div>
    </main>
  )
}

function ResultCard({ site }: { site: SiteData }) {
  const rows = [['Response', `${site.status} ${site.statusText}`], ['Content type', site.contentType], ['Language', site.language], ['Server', site.server]]
  return <section aria-live="polite" className="mt-14 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#cbd8cd] bg-white text-left shadow-[0_20px_60px_rgba(41,76,55,0.12)]">
    <div className="border-b border-[#e6eee7] bg-[#fbfdfb] p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#5d8c6c]"><span className="size-2 rounded-full bg-[#62a675]" /> Website found</div><h2 className="text-2xl font-medium tracking-[-0.03em]">{site.title}</h2><a href={site.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-[#73907c] hover:text-[#315c41]">{site.domain}<ArrowUpRight className="size-3.5" /></a></div><div className="flex size-12 items-center justify-center rounded-2xl bg-[#eaf4eb] text-[#39704c]"><Globe2 className="size-6" /></div></div><p className="mt-6 max-w-xl text-sm leading-6 text-[#66786b]">{site.description}</p></div>
    <div className="grid gap-px bg-[#e6eee7] sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="bg-white px-6 py-4 sm:px-8"><div className="text-xs text-[#92a198]">{label}</div><div className="mt-1 truncate text-sm font-medium text-[#32483a]">{value}</div></div>)}</div>
    <div className="flex flex-wrap gap-2 px-6 py-5 sm:px-8"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef7ef] px-3 py-1.5 text-xs font-medium text-[#39704c]"><Check className="size-3.5" /> HTTPS secured</span><span className="rounded-full bg-[#f2f5f2] px-3 py-1.5 text-xs font-medium text-[#718176]">Publicly reachable</span></div>
  </section>
}
