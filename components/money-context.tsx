"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { compactMoney, moneyFormatter } from "@/lib/money";
import { defaultSettings } from "@/lib/site-settings";

/*
 * The store currency and plan prices for the studio and affiliate
 * dashboards. Their layouts read them from Studio → Settings and provide them
 * here, so every table, chart and form shows what the checkout charges.
 */

export type PlanPrice = { slug: "warm-up" | "resident" | "headliner"; name: string; price: number };

const defaults = {
  currency: defaultSettings.general.currency as string,
  plans: defaultSettings.plans.map(({ slug, name, price }) => ({ slug, name, price })) as PlanPrice[],
};

const StoreContext = createContext(defaults);

export function CurrencyProvider({ currency, plans, children }: { currency: string; plans: PlanPrice[]; children: ReactNode }) {
  const value = useMemo(() => ({ currency, plans }), [currency, plans]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** money(10000) → "KSh 10,000" (cents only when there are some); whole() never shows cents; exact() always does. */
export function useMoney() {
  const { currency } = useContext(StoreContext);
  return useMemo(
    () => ({
      currency,
      money: moneyFormatter(currency),
      whole: moneyFormatter(currency, 0),
      exact: moneyFormatter(currency, 2),
      compact: (n: number) => compactMoney(n, currency),
    }),
    [currency],
  );
}

/** The plans with the names and prices set in Studio → Settings → Pricing. */
export const usePlanPrices = () => useContext(StoreContext).plans;
