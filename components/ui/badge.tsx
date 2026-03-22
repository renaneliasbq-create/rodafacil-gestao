import { cn, STATUS_COLORS, STATUS_LABELS, type StatusKey } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export function Badge({ status, className }: BadgeProps) {
  const color = STATUS_COLORS[status as StatusKey] ?? 'bg-gray-100 text-gray-600'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={cn('badge', color, className)}>
      {label}
    </span>
  )
}
