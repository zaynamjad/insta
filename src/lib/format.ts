export function formatCount(value: number | null): string | null {
  if (value === null) return null;
  if (value >= 1_000_000_000) return `${trimDecimal(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${trimDecimal(value / 1_000_000)}M`;
  if (value >= 1_000) return `${trimDecimal(value / 1_000)}K`;
  return value.toLocaleString("en-US");
}

function trimDecimal(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}
