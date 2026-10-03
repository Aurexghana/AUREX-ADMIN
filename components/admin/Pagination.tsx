"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Windowed page numbers - always shows first/last two and a run around
 *  the current page, collapsing the rest into an ellipsis so this stays
 *  readable even with dozens of pages. */
function pageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const keep = new Set<number>([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const sorted = Array.from(keep)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

/** Prev/next + page-number buttons, no fancy stuff. Renders nothing for
 *  a single page. */
export default function Pagination({ page, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="border border-grid-line px-3 py-1.5 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </button>

      {pageNumbers(page, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1.5 font-sans text-xs text-cream-dim">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-[2rem] border px-2.5 py-1.5 font-jakarta text-xs font-medium transition-colors ${
              p === page
                ? "border-gold/50 bg-gold/15 text-gold-bright"
                : "border-grid-line text-cream-dim hover:text-cream"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="border border-grid-line px-3 py-1.5 font-jakarta text-xs font-medium text-cream-dim transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
