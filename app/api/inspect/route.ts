import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function textFromHtml(html: string, pattern: RegExp) {
  const match = html.match(pattern)
  return match?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || ''
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
    const description = textFromHtml(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || 'A publicly reachable website with no meta description available.'
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
