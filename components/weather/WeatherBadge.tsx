import { weatherEmoji, weatherDesc, type DayWeather } from '@/lib/weather/openmeteo'

interface Props {
  weather: DayWeather
  size?: 'sm' | 'md'
}

export default function WeatherBadge({ weather, size = 'md' }: Props) {
  const emoji = weatherEmoji(weather.weatherCode)
  const desc  = weatherDesc(weather.weatherCode)

  if (size === 'sm') {
    // Compact: used in calendar month cells and week day headers
    return (
      <span
        title={`${desc} · ${weather.tempMax}° / ${weather.tempMin}°`}
        className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 select-none"
      >
        <span>{emoji}</span>
        <span>{weather.tempMax}°</span>
      </span>
    )
  }

  // Medium: used in timeline day headings
  return (
    <span
      title={desc}
      className="inline-flex items-center gap-1 text-xs text-slate-400 select-none"
    >
      <span className="text-sm">{emoji}</span>
      <span>{weather.tempMax}° / {weather.tempMin}°</span>
    </span>
  )
}
