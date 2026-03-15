import type { IconSvgName } from "~/components/ui/icon-svg"

export type MintyIconData = {
  name: IconSvgName
  keywords: string[]
}

export const MINTY_SVGS: MintyIconData[] = [
  // Money & Finance
  { name: "wallet", keywords: ["money", "cash", "payment"] },
  { name: "credit-card", keywords: ["payment", "card", "credit"] },
  { name: "building-bank", keywords: ["banking", "finance", "institution"] },
  { name: "cash-banknote", keywords: ["money", "payment", "dollar"] },
  { name: "currency-dollar", keywords: ["dollar", "money", "usd"] },
  { name: "coin-pound", keywords: ["pound", "money", "gbp"] },
  { name: "chart-area-line", keywords: ["graph", "analytics", "trend"] },
  { name: "chart-bar", keywords: ["graph", "analytics", "statistics"] },
  { name: "chart-pie", keywords: ["graph", "analytics", "distribution"] },
  { name: "trending-up", keywords: ["growth", "increase", "profit"] },
  { name: "trending-down", keywords: ["loss", "decrease", "decline"] },
  { name: "pig-money", keywords: ["savings", "save", "money"] },
  { name: "percentage", keywords: ["discount", "tax", "rate"] },
  { name: "tag", keywords: ["label", "category", "price"] },
  { name: "tags", keywords: ["labels", "categories", "tags"] },

  // Shopping
  { name: "shopping-cart", keywords: ["shopping", "buy", "purchase"] },
  { name: "basket", keywords: ["shopping", "groceries", "buy"] },
  { name: "gift", keywords: ["present", "surprise", "celebration"] },

  // Transport
  { name: "car", keywords: ["vehicle", "transport", "auto"] },

  // Media & Visual
  { name: "camera", keywords: ["photo", "photography", "picture"] },
  { name: "photo", keywords: ["image", "picture", "gallery"] },
  { name: "video", keywords: ["film", "recording", "media"] },

  // Files
  { name: "file", keywords: ["document", "paper", "file"] },
  { name: "file-description", keywords: ["document", "text", "file"] },
  { name: "file-analytics", keywords: ["report", "data", "analytics"] },
  { name: "presentation", keywords: ["slides", "deck", "meeting"] },
  { name: "clipboard", keywords: ["document", "notes", "list"] },

  // Editing
  { name: "pencil", keywords: ["write", "edit", "draw"] },
  { name: "palette", keywords: ["art", "design", "creative"] },

  // Math
  { name: "calculator", keywords: ["math", "numbers", "compute"] },
  { name: "plus", keywords: ["add", "new", "create"] },
  { name: "minus", keywords: ["remove", "subtract", "delete"] },
  { name: "divide", keywords: ["division", "math", "split"] },
  { name: "percentage", keywords: ["percent", "rate", "tax"] },

  // Devices & System
  { name: "device-desktop", keywords: ["computer", "pc", "desktop"] },
  { name: "device-mobile", keywords: ["phone", "mobile", "cell"] },
  { name: "database", keywords: ["storage", "data", "server"] },
  { name: "settings", keywords: ["config", "gear", "preferences"] },
  { name: "refresh", keywords: ["reload", "sync", "update"] },

  // Security
  { name: "lock", keywords: ["security", "secure", "protected"] },
  { name: "fingerprint", keywords: ["biometric", "secure", "identity"] },
  {
    name: "shield-exclamation",
    keywords: ["insurance", "protection", "security"],
  },

  // People
  { name: "user", keywords: ["person", "account", "profile"] },
  { name: "heart", keywords: ["health", "love", "wellness"] },
  { name: "activity", keywords: ["pulse", "activity", "heartbeat"] },

  // Places
  { name: "map-pin", keywords: ["location", "place", "pin"] },
  { name: "building", keywords: ["office", "work", "corporate"] },
  { name: "school", keywords: ["education", "learning", "academy"] },
  { name: "map", keywords: ["navigation", "directions", "travel"] },

  // Misc
  { name: "bell", keywords: ["notification", "alert", "reminder"] },
  { name: "star", keywords: ["favorite", "rating", "special"] },
  { name: "calendar", keywords: ["date", "schedule", "event"] },
  { name: "calendar-event", keywords: ["appointment", "meeting", "event"] },
  { name: "clock", keywords: ["time", "hour", "schedule"] },
  { name: "anchor", keywords: ["maritime", "stable", "fixed"] },
  { name: "archive", keywords: ["store", "save", "backup"] },
  { name: "target", keywords: ["goal", "aim", "objective"] },
  { name: "filter", keywords: ["sort", "search", "refine"] },
  { name: "search", keywords: ["find", "look", "query"] },
  { name: "external-link", keywords: ["open", "link", "navigate"] },
  { name: "repeat", keywords: ["recurring", "cycle", "loop"] },
  { name: "hash", keywords: ["number", "tag", "social"] },
  { name: "affiliate", keywords: ["referral", "partner", "network"] },
  { name: "adjustments", keywords: ["settings", "tune", "configure"] },
  { name: "chart-dots", keywords: ["scatter", "data", "analytics"] },
  { name: "info-circle", keywords: ["info", "details", "help"] },
  { name: "alert-circle", keywords: ["warning", "alert", "attention"] },
  { name: "check", keywords: ["success", "done", "complete"] },
  { name: "circle-plus", keywords: ["add", "new", "create"] },
  { name: "trash", keywords: ["delete", "remove", "bin"] },
]
