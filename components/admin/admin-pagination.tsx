import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getVisiblePages } from "@/lib/seller-dashboard-utils";

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(totalPages, 1);
  const visiblePages = getVisiblePages(page, pageCount);
  const hasTrailingPages = visiblePages.at(-1) !== pageCount;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text=""
            href="#"
            aria-disabled={page <= 1}
            onClick={(event) => {
              event.preventDefault();
              onPageChange(Math.max(page - 1, 1));
            }}
          />
        </PaginationItem>
        {visiblePages.map((visiblePage) => (
          <PaginationItem key={visiblePage}>
            <PaginationLink
              href="#"
              isActive={visiblePage === page}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(visiblePage);
              }}
            >
              {visiblePage}
            </PaginationLink>
          </PaginationItem>
        ))}
        {hasTrailingPages && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive={page === pageCount}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(pageCount);
                }}
              >
                {pageCount}
              </PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem>
          <PaginationNext
            text=""
            href="#"
            aria-disabled={page >= pageCount}
            onClick={(event) => {
              event.preventDefault();
              onPageChange(Math.min(page + 1, pageCount));
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
