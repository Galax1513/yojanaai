import { FileText } from "lucide-react"

interface DocumentInfo {
  id: number | string
  name: string
  reason: string
}

/**
 * Informational only — this is a document the SCHEME requires when
 * applying on the official portal, not something the user uploads to
 * or stores with YojanaAI. There is no per-user "ready/missing" status:
 * YojanaAI never collects or tracks a user's own documents.
 */
export function DocumentStatusRow({ document }: { document: DocumentInfo }) {
  return (
    <div className="flex items-start gap-3.5 border-b border-line py-4 first:pt-0 last:border-none last:pb-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg/[0.06]">
        <FileText className="size-4 text-muted" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-medium text-fg">{document.name}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{document.reason}</p>
      </div>
    </div>
  )
}
