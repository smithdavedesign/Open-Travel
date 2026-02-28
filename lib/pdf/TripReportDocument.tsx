/**
 * Server-only — imported exclusively from API routes.
 * Uses @react-pdf/renderer primitives (not DOM elements).
 */
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Trip, Event, Expense, TripMember, Balance } from '@/types'

// ─── Styles ────────────────────────────────────────────────────────────────

const c = {
  navy:    '#1e293b',
  slate:   '#475569',
  muted:   '#94a3b8',
  border:  '#e2e8f0',
  bg:      '#f8fafc',
  blue:    '#2563eb',
  green:   '#16a34a',
  red:     '#dc2626',
  amber:   '#d97706',
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', padding: 48, backgroundColor: '#ffffff', fontSize: 10, color: c.navy },

  // Header
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  tripName:     { fontSize: 22, fontFamily: 'Helvetica-Bold', color: c.navy, marginBottom: 3 },
  subMeta:      { fontSize: 10, color: c.slate },
  generatedAt:  { fontSize: 9, color: c.muted, textAlign: 'right', marginTop: 4 },

  divider: { borderBottomWidth: 1, borderBottomColor: c.border, marginVertical: 14 },

  // Section headings
  sectionHeading: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: c.navy, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },

  // Members
  memberChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 14 },
  memberChip:   { backgroundColor: c.bg, border: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  memberName:   { fontSize: 9, color: c.slate },

  // Day heading (itinerary)
  dayHeading:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 5 },

  // Event row
  eventRow:     { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5, paddingHorizontal: 8, marginBottom: 2, borderRadius: 4 },
  eventLeft:    { width: 16, marginRight: 8, paddingTop: 1 },
  eventType:    { fontSize: 8, color: c.blue, textTransform: 'uppercase', letterSpacing: 0.5 },
  eventTitle:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.navy },
  eventMeta:    { fontSize: 9, color: c.slate, marginTop: 1 },
  eventAlt:     { backgroundColor: c.bg },

  // Expense table
  tableHeader:  { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, backgroundColor: c.bg, marginBottom: 1 },
  tableRow:     { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: c.border },
  tableRowAlt:  { backgroundColor: c.bg },
  col1:         { flex: 2 },
  col2:         { flex: 1 },
  col3:         { flex: 1 },
  col4:         { width: 70, textAlign: 'right' },
  colHeader:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.slate, textTransform: 'uppercase' },
  colText:      { fontSize: 9, color: c.slate },
  colTextBold:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.navy },
  totalRow:     { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8, marginTop: 4, borderTopWidth: 1.5, borderTopColor: c.navy },
  totalLabel:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.navy, marginRight: 8 },
  totalAmount:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.navy, width: 70, textAlign: 'right' },

  // Balances
  balanceRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: c.border },
  balanceName:  { fontSize: 10, color: c.slate },
  balanceOwed:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.green },
  balanceOwes:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.red },
  balanceZero:  { fontSize: 10, color: c.muted },

  // Page number
  pageNumber: { position: 'absolute', bottom: 24, right: 48, fontSize: 8, color: c.muted },
  footer:     { position: 'absolute', bottom: 24, left: 48, fontSize: 8, color: c.muted },
})

// ─── Helpers ───────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, string> = {
  flight: '✈', hotel: '⌂', car_rental: '⊙', activity: '★',
  excursion: '◉', restaurant: '◆', transfer: '→', custom: '•',
}

const CATEGORY_LABELS: Record<string, string> = {
  flights: 'Flights', accommodation: 'Accommodation', food: 'Food & Drink',
  activities: 'Activities', transport: 'Transport', misc: 'Misc',
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(amount)
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function fmtTime(t: string | null) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function memberDisplay(members: TripMember[], userId: string) {
  const m = members.find(m => m.user_id === userId)
  return m?.profiles?.full_name ?? m?.profiles?.email ?? userId.slice(0, 8)
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MemberChips({ members }: { members: TripMember[] }) {
  return (
    <View style={s.memberChips}>
      {members.map(m => (
        <View key={m.id} style={s.memberChip}>
          <Text style={s.memberName}>
            {m.profiles?.full_name ?? m.profiles?.email ?? m.user_id.slice(0, 8)}
            {m.role === 'owner' ? ' (owner)' : ''}
          </Text>
        </View>
      ))}
    </View>
  )
}

function ItinerarySection({ timeline }: { timeline: Record<string, Event[]> }) {
  const dates = Object.keys(timeline).sort()
  if (dates.length === 0) return (
    <Text style={{ fontSize: 10, color: c.muted, marginBottom: 14 }}>No events added yet.</Text>
  )
  return (
    <>
      {dates.map(date => (
        <View key={date}>
          <Text style={s.dayHeading}>{fmtDate(date)}</Text>
          {timeline[date].map((event, i) => {
            const timeStr = event.start_time ? fmtTime(event.start_time) : ''
            const endStr  = event.end_time ? ` – ${fmtTime(event.end_time)}` : ''
            const meta = [
              event.location,
              timeStr ? `${timeStr}${endStr}` : '',
              event.confirmation_code ? `Ref: ${event.confirmation_code}` : '',
              event.cost ? fmt(event.cost, event.currency) : '',
            ].filter(Boolean).join('  ·  ')

            return (
              <View key={event.id} style={[s.eventRow, i % 2 === 1 ? s.eventAlt : {}]}>
                <View style={s.eventLeft}>
                  <Text style={{ fontSize: 11, color: c.blue }}>
                    {EVENT_ICONS[event.type] ?? '•'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventType}>{event.type.replace('_', ' ')}</Text>
                  <Text style={s.eventTitle}>{event.title}</Text>
                  {meta ? <Text style={s.eventMeta}>{meta}</Text> : null}
                </View>
              </View>
            )
          })}
        </View>
      ))}
    </>
  )
}

function ExpensesSection({ expenses, members }: { expenses: Expense[]; members: TripMember[] }) {
  if (expenses.length === 0) return (
    <Text style={{ fontSize: 10, color: c.muted, marginBottom: 14 }}>No expenses logged yet.</Text>
  )

  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date))
  const total = sorted.reduce((s, e) => s + e.amount, 0)
  const currency = sorted[0]?.currency ?? 'USD'

  return (
    <>
      {/* Table header */}
      <View style={s.tableHeader}>
        <Text style={[s.col1, s.colHeader]}>Description</Text>
        <Text style={[s.col2, s.colHeader]}>Category</Text>
        <Text style={[s.col3, s.colHeader]}>Paid by</Text>
        <Text style={[s.col4, s.colHeader]}>Amount</Text>
      </View>

      {sorted.map((expense, i) => (
        <View key={expense.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
          <View style={s.col1}>
            <Text style={s.colTextBold}>{expense.title}</Text>
            <Text style={[s.colText, { fontSize: 8, color: c.muted }]}>{expense.date}</Text>
          </View>
          <Text style={[s.col2, s.colText]}>{CATEGORY_LABELS[expense.category] ?? expense.category}</Text>
          <Text style={[s.col3, s.colText]}>{memberDisplay(members, expense.paid_by)}</Text>
          <Text style={[s.col4, s.colTextBold]}>{fmt(expense.amount, expense.currency)}</Text>
        </View>
      ))}

      <View style={s.totalRow}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalAmount}>{fmt(total, currency)}</Text>
      </View>
    </>
  )
}

function BalancesSection({ balances, members }: { balances: Record<string, Balance>; members: TripMember[] }) {
  const entries = Object.values(balances)
  if (entries.length === 0) return (
    <Text style={{ fontSize: 10, color: c.muted }}>No balances to show.</Text>
  )
  return (
    <>
      {entries.map(b => {
        const name = memberDisplay(members, b.userId)
        const absNet = Math.abs(b.net)
        const isSettled = absNet < 0.01
        return (
          <View key={b.userId} style={s.balanceRow} wrap={false}>
            <Text style={s.balanceName}>{name}</Text>
            {isSettled ? (
              <Text style={s.balanceZero}>Settled</Text>
            ) : b.net > 0 ? (
              <Text style={s.balanceOwed}>+{absNet.toFixed(2)} owed to them</Text>
            ) : (
              <Text style={s.balanceOwes}>−{absNet.toFixed(2)} they owe</Text>
            )}
          </View>
        )
      })}
    </>
  )
}

// ─── Main Document ─────────────────────────────────────────────────────────

interface TripReportProps {
  trip: Trip
  members: TripMember[]
  timeline: Record<string, Event[]>
  expenses: Expense[]
  balances: Record<string, Balance>
}

export function TripReportDocument({ trip, members, timeline, expenses, balances }: TripReportProps) {
  const dateRange = [trip.start_date, trip.end_date].filter(Boolean).join(' – ')
  const destinations = trip.destinations.join(' → ')
  const generatedAt = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Document title={`${trip.name} — Trip Report`} author="Open Travel">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.tripName}>{trip.name}</Text>
            {destinations && <Text style={s.subMeta}>{destinations}</Text>}
            {dateRange   && <Text style={s.subMeta}>{dateRange}</Text>}
          </View>
          <View>
            <Text style={[s.subMeta, { textAlign: 'right', textTransform: 'uppercase', fontSize: 8, letterSpacing: 1, color: c.blue }]}>
              OPEN TRAVEL
            </Text>
            <Text style={s.generatedAt}>Generated {generatedAt}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Members */}
        <Text style={s.sectionHeading}>Members</Text>
        <MemberChips members={members} />

        <View style={s.divider} />

        {/* Itinerary */}
        <Text style={s.sectionHeading}>Itinerary</Text>
        <ItinerarySection timeline={timeline} />

        <View style={s.divider} />

        {/* Expenses */}
        <Text style={s.sectionHeading}>Expenses</Text>
        <ExpensesSection expenses={expenses} members={members} />

        <View style={s.divider} />

        {/* Balances */}
        <Text style={s.sectionHeading}>Balances</Text>
        <BalancesSection balances={balances} members={members} />

        {/* Footer */}
        <Text style={s.footer}>Open Travel · Trip Report</Text>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
