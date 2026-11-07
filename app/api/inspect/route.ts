import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function textFromHtml(html: string, pattern: RegExp) {
  const match = html.match(pattern)
  return match?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || ''
}

function metaContent(html: string, attribute: string, value: string) {
  const pattern = new RegExp(`<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i')
  return textFromHtml(html, pattern)
}

function createSummary(html: string, fallback: string) {
  const candidate = metaContent(html, 'name', 'description') || metaContent(html, 'property', 'og:description') || textFromHtml(html, /<p[^>]*>([\s\S]*?)<\/p>/i) || fallback
  const words = candidate.split(/\s+/).filter(Boolean)
  return words.length > 55 ? `${words.slice(0, 55).join(' ')}…` : candidate
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
    const parsed = new URL(rawUrl)

    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Please enter a valid HTTP or HTTPS address.')

    const response = await fetch(parsed.href, {
      headers: { 'User-Agent': 'sitecheck/1.0 website metadata reader' },
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    })
    const html = response.headers.get('content-type')?.includes('text/html') ? await response.text() : ''
    const title = textFromHtml(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || parsed.hostname.replace(/^www\./, '')
    const description = createSummary(html, 'A publicly reachable website with no summary available.')
    const language = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] || 'Not specified'

    return NextResponse.json({
      url: parsed.href,
      domain: parsed.hostname,
      title,
      description,
      status: response.status,
      statusText: response.statusText || 'OK',
      contentType: response.headers.get('content-type')?.split(';')[0] || 'Unknown',
      server: response.headers.get('server') || 'Not disclosed',
      language,
      indexed: 'Public page',
      hasHttps: parsed.protocol === 'https:',
    })
  } catch (error) {
    const message = error instanceof TypeError ? 'Please enter a complete website address, such as https://example.com.' : error instanceof Error && error.name === 'TimeoutError' ? 'That website took too long to respond. Try another address.' : error instanceof Error ? error.message : 'We could not inspect that address.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
