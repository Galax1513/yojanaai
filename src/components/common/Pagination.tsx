import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
}

export function Pagination({ currentPage, totalPages, onPrevious, onNext }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
      <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={onPrevious} aria-label="Previous page">
        <ChevronLeft />
      </Button>
      <span className="glass rounded-full px-5 py-2.5 text-sm text-muted">
        Page <span className="font-medium text-fg">{currentPage.toLocaleString("en-IN")}</span> of{" "}
        {totalPages.toLocaleString("en-IN")}
      </span>
      <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={onNext} aria-label="Next page">
        <ChevronRight />
      </Button>
    </nav>
  )
}
