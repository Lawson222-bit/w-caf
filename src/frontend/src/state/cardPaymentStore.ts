import { create } from "zustand";

export interface CardPaymentItem {
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface CardPaymentState {
  activePaymentCode: string | null;
  activeOrderItems: CardPaymentItem[];
  activeOrderTotal: number;
  activeOrderCustomer: string;
  // Real-time cart sync from cashier POS
  liveCartItems: CardPaymentItem[];
  liveCartTotal: number;
  isPaymentActive: boolean;
  isCheckoutActive: boolean;
  // Pairing — pairingCode is set when cashier opens 2516, cleared when they leave
  pairingCode: string | null;
  paired: boolean;
  setActivePayment: (
    code: string,
    items: CardPaymentItem[],
    total: number,
    customer: string,
  ) => void;
  clearActivePayment: () => void;
  // Live cart updates
  setLiveCart: (items: CardPaymentItem[], total: number) => void;
  clearLiveCart: () => void;
  setPaymentActive: (active: boolean) => void;
  setCheckoutActive: (active: boolean) => void;
  // Pairing
  setPairingCode: (code: string | null) => void;
  setPaired: (paired: boolean) => void;
  clearPairing: () => void;
  // Called when cashier session ends — clears pairing so 6767 returns to code entry
  endCashierSession: () => void;
}

export const useCardPaymentStore = create<CardPaymentState>()((set) => ({
  activePaymentCode: null,
  activeOrderItems: [],
  activeOrderTotal: 0,
  activeOrderCustomer: "",
  liveCartItems: [],
  liveCartTotal: 0,
  isPaymentActive: false,
  isCheckoutActive: false,
  pairingCode: null,
  paired: false,
  setActivePayment: (code, items, total, customer) =>
    set({
      activePaymentCode: code,
      activeOrderItems: items,
      activeOrderTotal: total,
      activeOrderCustomer: customer,
    }),
  clearActivePayment: () =>
    set({
      activePaymentCode: null,
      activeOrderItems: [],
      activeOrderTotal: 0,
      activeOrderCustomer: "",
      isPaymentActive: false,
      isCheckoutActive: false,
    }),
  setLiveCart: (items, total) =>
    set({
      liveCartItems: items,
      liveCartTotal: total,
    }),
  clearLiveCart: () =>
    set({
      liveCartItems: [],
      liveCartTotal: 0,
    }),
  setPaymentActive: (active) =>
    set({
      isPaymentActive: active,
    }),
  setCheckoutActive: (active) =>
    set({
      isCheckoutActive: active,
    }),
  setPairingCode: (code) => set({ pairingCode: code }),
  setPaired: (paired) => set({ paired }),
  clearPairing: () =>
    set({
      pairingCode: null,
      paired: false,
      activePaymentCode: null,
      activeOrderItems: [],
      activeOrderTotal: 0,
      activeOrderCustomer: "",
      liveCartItems: [],
      liveCartTotal: 0,
      isPaymentActive: false,
      isCheckoutActive: false,
    }),
  endCashierSession: () =>
    set({
      pairingCode: null,
      paired: false,
      liveCartItems: [],
      liveCartTotal: 0,
      isPaymentActive: false,
      isCheckoutActive: false,
      activePaymentCode: null,
      activeOrderItems: [],
      activeOrderTotal: 0,
      activeOrderCustomer: "",
    }),
}));
