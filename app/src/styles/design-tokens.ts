/**
 * VeriSnap Design System
 * 
 * Premium, restrained, trustworthy.
 * Inspired by: Linear, Stripe, Arc, Mercury
 * 
 * NOT: crypto gradients, neon accents, AI startup aesthetics
 */

export const colors = {
  // Backgrounds
  bg: {
    primary: "#fafafa",      // Soft off-white (zinc-50)
    secondary: "#f4f4f5",    // Very light slate (zinc-100)
    tertiary: "#e4e4e7",     // Subtle divider (zinc-200)
  },

  // Surfaces
  surface: {
    primary: "#ffffff",      // White cards
    elevated: "#ffffff",     // Elevated surfaces
    hover: "#fafafa",        // Hover state
    pressed: "#f4f4f5",      // Pressed state
  },

  // Text
  text: {
    primary: "#18181b",      // Charcoal (zinc-900)
    secondary: "#52525b",    // Muted slate (zinc-600)
    tertiary: "#a1a1aa",     // Subtle (zinc-400)
    inverse: "#ffffff",      // On dark backgrounds
  },

  // Borders
  border: {
    default: "#e4e4e7",      // Soft gray (zinc-200)
    subtle: "#f4f4f5",       // Very subtle (zinc-100)
    hover: "#d4d4d8",        // Hover (zinc-300)
  },

  // Primary accent - Deep emerald/teal
  accent: {
    default: "#059669",      // Emerald-600
    hover: "#047857",        // Emerald-700
    pressed: "#065f46",      // Emerald-800
    subtle: "#d1fae5",       // Emerald-100
    text: "#064e3b",         // Emerald-900
  },

  // Success - Brighter green (wins/verified/payout)
  success: {
    default: "#22c55e",      // Green-500
    bg: "#dcfce7",           // Green-100
    text: "#15803d",         // Green-700
  },

  // Error - Muted red (failed/lost/expired)
  error: {
    default: "#dc2626",      // Red-600
    bg: "#fef2f2",           // Red-50
    text: "#b91c1c",         // Red-700
  },

  // Warning - Amber (timers/urgency)
  warning: {
    default: "#f59e0b",      // Amber-500
    bg: "#fef3c7",           // Amber-100
    text: "#b45309",         // Amber-700
  },

  // Trust indicators (subdued, not flashy)
  trust: {
    xrpl: "#059669",         // Emerald for blockchain
    pinata: "#525252",       // Neutral gray for storage
    gemini: "#52525b",       // Neutral for AI
  },
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
  md: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
  lg: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  xl: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
} as const;

export const fontSizes = {
  xs: "12px",
  sm: "13px",
  base: "14px",
  md: "15px",
  lg: "16px",
  xl: "18px",
  "2xl": "20px",
  "3xl": "24px",
  "4xl": "28px",
} as const;

export const lineHeights = {
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.625",
} as const;

export const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const animation = {
  fast: "150ms",
  normal: "300ms",
  slow: "600ms",
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },
  springBouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
} as const;
