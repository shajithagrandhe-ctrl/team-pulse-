export const getPagination = (page?: number, pageSize?: number) => {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.min(1_000_000, Math.trunc(page!))) : 1;
  const safeSize = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, Math.trunc(pageSize!))) : 20;
  const skip = (safePage - 1) * safeSize;

  return {
    page: safePage,
    pageSize: safeSize,
    skip,
    take: safeSize
  };
};
