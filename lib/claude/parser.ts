import Anthropic from '@anthropic-ai/sdk'
import type { ParsedEventData } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a travel document parser for Open Travel (Open Fly Travel Assistant).
Extract structured booking information from the provided document or image.
Always return a single valid JSON object — no markdown, no explanation, just JSON.
Use YYYY-MM-DD for dates and HH:MM (24h) for times. Use null for unknown fields.
Set confidence (0.0–1.0) based on how clearly the document matches a known booking type.`

const SCHEMA_HINT = `Return JSON matching this shape exactly:
{
  "type": "flight|hotel|car_rental|activity|excursion|restaurant|transfer|custom",
  "title": "short human-readable title",
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM or null",
  "end_time": "HH:MM or null",
  "location": "city or address or null",
  "confirmation_code": "booking ref or null",
  "cost": 123.45 or null,
  "currency": "USD",
  "notes": "any additional useful info or null",
  "data": {
    // For flights: airline, flight_number, origin (IATA), destination (IATA), seat, class
    // For hotels: property_name, address, check_in, check_out, room_type, guests
    // For car_rental: provider, pickup_location, dropoff_location, vehicle_class
    // For others: relevant fields
  },
  "confidence": 0.92
}`

export async function parseDocumentText(text: string): Promise<ParsedEventData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Parse this travel document and return JSON.\n\n${SCHEMA_HINT}\n\nDocument:\n${text}`,
      },
    ],
  })

  return extractJson(response)
}

export async function parseDocumentImage(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<ParsedEventData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `Parse this travel booking document and return JSON.\n\n${SCHEMA_HINT}`,
          },
        ],
      },
    ],
  })

  return extractJson(response)
}

function extractJson(response: Anthropic.Message): ParsedEventData {
  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected non-text response from Claude')

  const match = block.text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in Claude response')

  return JSON.parse(match[0]) as ParsedEventData
}
