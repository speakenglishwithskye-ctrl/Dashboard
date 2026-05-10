import { cn } from '@/lib/utils'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-5 h-5 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
    </div>
  )
}
