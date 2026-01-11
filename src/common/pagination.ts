import { Request } from "express";
import { z } from "zod";

export const FIRST_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  links: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default(String(FIRST_PAGE))
    .transform((val) => {
      const num = parseInt(val, 10);
      return Number.isNaN(num) || num < 1 ? FIRST_PAGE : num;
    }),
  size: z
    .string()
    .optional()
    .default(String(DEFAULT_PAGE_SIZE))
    .transform((val) => {
      const num = parseInt(val, 10);
      if (Number.isNaN(num) || num < 1) return DEFAULT_PAGE_SIZE;
      if (num > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
      return num;
    }),
  search: z
    .string()
    .optional()
    .transform((val) => (val ? decodeURIComponent(val) : undefined)),
});

export type PaginationDto = z.infer<typeof paginationSchema>;

export function buildPagination<T>(
  data: T[],
  total: number,
  params: PaginationDto,
  req: Request,
): PaginatedResult<T> {
  const { page, size } = params;
  const totalPages = Math.ceil(total / size);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const baseUrl = `${req.protocol}://${req.get("host")}${req.baseUrl}${req.path}`;
  const query = new URLSearchParams(req.query as Record<string, string>);
  query.set("size", String(size));

  query.set("page", String(page));
  const self = `${baseUrl}?${query.toString()}`;

  let next: string | undefined;
  if (hasNextPage) {
    query.set("page", String(page + 1));
    next = `${baseUrl}?${query.toString()}`;
  }

  let prev: string | undefined;
  if (hasPreviousPage) {
    query.set("page", String(page - 1));
    prev = `${baseUrl}?${query.toString()}`;
  }

  return {
    data,
    meta: {
      page,
      size,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    links: { self, next, prev },
  };
}
