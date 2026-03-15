import { NextRequest, NextResponse } from 'next/server'

/**
 * Resolves a (potentially shortened) URL to its final destination.
 * Used to expand maps.app.goo.gl short links before parsing.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    return NextResponse.json({ resolvedUrl: res.url })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 400 })
  }
}
