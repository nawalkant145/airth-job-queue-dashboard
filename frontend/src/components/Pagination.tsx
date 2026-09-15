import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array [1, 2, 3, ...]
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container">
      <div className="pagination-summary">
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> {totalItems === 1 ? 'job' : 'jobs'}
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="btn btn-page"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            &larr; Previous
          </button>

          <div className="pagination-numbers">
            {pageNumbers.map((page) => (
              <button
                key={page}
                className={`btn btn-page-number ${currentPage === page ? 'btn-page-active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="btn btn-page"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
