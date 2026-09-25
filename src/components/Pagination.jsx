// Page numbers to show: always the first and last page, plus the current page's neighbours,
// with '…' filling any gaps (e.g. 1 … 4 5 6 … 10).
function getPageItems(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  const items = [];
  sorted.forEach((page, index) => {
    const gap = page - (sorted[index - 1] ?? 0);
    if (gap === 2) items.push(page - 1);
    else if (gap > 2) items.push(`gap-${page}`);
    items.push(page);
  });
  return items;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Cocktail pages">
      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &larr; Prev
      </button>

      <ul className="pagination__list">
        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === 'string' ? (
            <li key={item} className="pagination__gap" aria-hidden="true">&hellip;</li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className="pagination__button pagination__number"
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="pagination__button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next &rarr;
      </button>
    </nav>
  );
}
