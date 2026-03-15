import { NextRequest, NextResponse } from 'next/server'

/**
 * Resolves a (potentially shortened) URL to its final destination.
 * Used to expand maps.app.goo.gl short links before parsing.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    // Use GET (not HEAD) — Google share links may not redirect on HEAD.
    // Add a browser User-Agent so Google's CDN doesn't block or short-circuit the redirect.
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    })
    return NextResponse.json({ resolvedUrl: res.url })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 400 })
  }
}
