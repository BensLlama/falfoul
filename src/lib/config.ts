// App-wide settings. Change the currency here if you like.
export const CURRENCY = "DH";

export const EXPIRY_WINDOWS = [
  { key: "expired", label: "Expired", days: 0 },
  { key: "3days", label: "Within 3 days", days: 3 },
  { key: "week", label: "Within 1 week", days: 7 },
  { key: "month", label: "Within 1 month", days: 30 },
] as const;
