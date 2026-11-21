export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  SHIPPED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  PARTIALLY_PAID: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300",
};

export const badgeBase = "px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap";
export const badgeFallback = "bg-gray-100 text-gray-600 dark:bg-gray-700/40 dark:text-gray-300";

export const formatLabel = (value: string) =>
  value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());