import { createClient } from '@/lib/supabase/server'
import { requireTripRole, ForbiddenError } from '@/lib/auth/rbac'
import * as TripController from '@/controllers/trip.controller'
import * as EventController from '@/controllers/event.controller'
import * as ExpenseController from '@/controllers/expense.controller'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { TripReportDocument } from '@/lib/pdf/TripReportDocument'
import { NextRequest, NextResponse } from 'next/server'
import React from 'react'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tripId } = await params
    await requireTripRole(tripId, user.id, 'viewer')

    // Fetch all data in parallel
    const [{ trip, members }, timeline, expenses, balances] = await Promise.all([
      TripController.getTripWithMembers(tripId),
      EventController.getTripTimeline(tripId),
      ExpenseController.getTripExpenses(tripId),
      ExpenseController.computeBalances(tripId),
    ])

    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

    const element = React.createElement(TripReportDocument, { trip, members, timeline, expenses, balances })
    const buffer = await renderToBuffer(element as React.ReactElement<DocumentProps>)

    const filename = `${trip.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (err: unknown) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 })
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[GET /api/trips/[tripId]/export] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
