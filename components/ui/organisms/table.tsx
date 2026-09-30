"use client";

import { motion } from "framer-motion";
import { forwardRef, useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Search, Filter } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
};

export interface TableProps {
  columns: Column<any>[];
  data: any[];
  onRowClick?: (row: any) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onFilter?: (query: string) => void;
  filterQuery?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  overflowVisibleColumnKeys?: string[];
  /** `plain` drops the decorative rounded frame used by list pages. `bordered` keeps it. */
  presentation?: "bordered" | "plain";
}

// Helper function to safely get string representation of any value for filtering
function getFilterableValue(value: unknown): string {
  if (typeof value === "string") return value as string;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return String(value);
}

function TableComponent(
  {
    columns,
    data,
    onRowClick,
    onSort,
    sortColumn,
    sortDirection = "asc",
    onFilter,
    filterQuery = "",
    emptyMessage = "No data available",
    isLoading = false,
    className = "",
    overflowVisibleColumnKeys = [],
    presentation = "bordered",
  }: TableProps,
  ref: React.Ref<HTMLTableElement>
) {
  const [localSortColumn, setLocalSortColumn] = useState<string | null>(null);
  const [localSortDirection, setLocalSortDirection] = useState<"asc" | "desc">("asc");
  const [localQuery, setLocalQuery] = useState(filterQuery);

  useEffect(() => {
    setLocalQuery(filterQuery);
  }, [filterQuery]);

  const handleSort = (columnKey: string) => {
    const column = columns.find((item) => item.key === columnKey);
    if (!column?.sortable && !onSort) return;
    const newDirection =
      localSortColumn === columnKey && localSortDirection === "asc" ? "desc" : "asc";
    setLocalSortColumn(columnKey);
    setLocalSortDirection(newDirection);
    onSort?.(columnKey, newDirection);
  };

  const handleFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalQuery(value);
    onFilter?.(value);
  };

  const activeQuery = onFilter ? filterQuery : localQuery;

  const filteredData = activeQuery
    ? data.filter((row) => {
        // Convert row to object for Object.values()
        const rowObj = row as Record<string, unknown>;
        const rowValues = Object.values(rowObj);
        return rowValues.some((value) =>
          getFilterableValue(value).toLowerCase().includes(activeQuery.toLowerCase())
        );
      })
    : data;

  const sortedData = localSortColumn
    ? [...filteredData].sort((a, b) => {
        const aObj = a as Record<string, unknown>;
        const bObj = b as Record<string, unknown>;
        const aValue = aObj[localSortColumn] ?? "";
        const bValue = bObj[localSortColumn] ?? "";
        const comparison = String(aValue ?? "").localeCompare(String(bValue ?? ""));
        return localSortDirection === "asc" ? comparison : -comparison;
      })
    : filteredData;

  const plain = presentation === "plain";

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-console-muted" />
          <input
            type="text"
            placeholder="Filter..."
            value={activeQuery}
            onChange={handleFilter}
            aria-label="Filter table"
            className="w-full rounded-md border border-console-control bg-console-surface py-2 pl-10 pr-3 text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
          />
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 self-end text-sm text-console-muted hover:text-[color:var(--text-primary)] sm:self-auto"
        >
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      {isLoading || sortedData.length === 0 ? (
        <div className="border-t border-console-separator px-3 py-8 text-center text-sm text-console-muted">
          {isLoading ? "Loading..." : emptyMessage}
        </div>
      ) : (
        <div
          className={
            plain
              ? "overflow-x-auto"
              : "overflow-x-auto overflow-y-hidden rounded-lg border border-console-control"
          }
        >
          <table
            ref={ref}
            className="w-full min-w-[48rem] text-left text-[color:var(--text-primary)]"
          >
            <thead>
              <tr className="border-b border-console-separator bg-console-header">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-console-muted"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="group flex items-center gap-1 transition-colors hover:text-[color:var(--text-primary)]"
                    >
                      {column.header}
                      {column.sortable && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          {localSortColumn === column.key ? (
                            localSortDirection === "asc" ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )
                          ) : (
                            <MoreHorizontal size={14} />
                          )}
                        </motion.span>
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-console-separator">
              {sortedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onRowClick?.(row)}
                  className="group cursor-pointer transition-colors hover:bg-console-hover focus-within:bg-console-hover"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3 py-3 ${overflowVisibleColumnKeys.includes(column.key) ? "overflow-visible" : "whitespace-nowrap"}`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const Table = forwardRef(TableComponent);
Table.displayName = "Table";
