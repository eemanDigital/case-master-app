import { useState, useCallback } from "react";
import { DEFAULT_PAGE_SIZE } from "../utils/constants";

/**
 * Custom hook for managing pagination state
 * @param {number} initialPage - Initial page number (default: 1)
 * @param {number} initialPageSize - Initial page size (default: from constants)
 * @returns {object} Pagination state and handlers
 */
const usePagination = (
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const handlePageChange = useCallback(
    (page, newPageSize) => {
      setCurrentPage(page);
      if (newPageSize && newPageSize !== pageSize) {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
      }
    },
    [pageSize],
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  const paginationConfig = {
    current: currentPage,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    onChange: handlePageChange,
    pageSizeOptions: ["10", "20", "50", "100"],
  };

  return {
    currentPage,
    pageSize,
    total,
    setTotal,
    setCurrentPage,
    setPageSize,
    handlePageChange,
    resetPagination,
    paginationConfig,
  };
};

export default usePagination;
