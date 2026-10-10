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
    <div className="flex items-start gap-3 border-b border-canvas-line/60 py-3.5 last:border-none">
      <FileText className="mt-0.5 size-4 shrink-0 text-mist" />
      <div>
        <p className="text-sm font-medium text-sand">{document.name}</p>
        <p className="mt-0.5 text-xs text-mist">{document.reason}</p>
      </div>
    </div>
  )
}
