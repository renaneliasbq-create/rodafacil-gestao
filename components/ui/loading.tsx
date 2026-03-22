import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('w-5 h-5 animate-spin', className)} />
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner className="text-blue-600 w-8 h-8" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded bg-gray-100 animate-pulse flex-1"
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="h-7 bg-gray-100 rounded w-1/2" />
    </div>
  )
}
