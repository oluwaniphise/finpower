"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPageItems(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (page >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, "...", page - 1, page, page + 1, "...", totalPages];
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  isLoading = false,
  onPageChange,
  className,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const pageItems = getPageItems(safePage, safeTotalPages);
  const canGoPrevious = safePage > 1 && !isLoading;
  const canGoNext = safePage < safeTotalPages && !isLoading;
  const firstItem =
    totalItems && pageSize ? (safePage - 1) * pageSize + 1 : undefined;
  const lastItem =
    totalItems && pageSize
      ? Math.min(safePage * pageSize, totalItems)
      : undefined;

  if (safeTotalPages <= 1 && !totalItems) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="text-sm text-gray-500">
        {typeof totalItems === "number" && firstItem && lastItem ? (
          <>
            Showing {firstItem}-{lastItem} of {totalItems}
          </>
        ) : (
          <>
            Page {safePage} of {safeTotalPages}
          </>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {pageItems.map((item, index) =>
            item === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 min-w-9 items-center justify-center px-2 text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === safePage ? "default" : "outline"}
                size="sm"
                disabled={isLoading}
                onClick={() => onPageChange(item)}
                aria-current={item === safePage ? "page" : undefined}
                aria-label={`Go to page ${item}`}
                className="min-w-9 px-3"
              >
                {item}
              </Button>
            ),
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canGoNext}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}
