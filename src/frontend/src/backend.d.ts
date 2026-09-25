import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomerOrder {
    id: bigint;
    customerName: string;
    status: string;
    total: number;
    paymentMethod?: string;
    wPayCode?: string;
    timestamp: Time;
    items: Array<MenuItem>;
}
export interface MenuItem {
    name: string;
    category?: string;
    price: number;
}
export interface CustomerCard {
    id: string;
    cvv: string;
    balance: number;
    cardName: string;
    customerUsername: string;
    expirationDate: string;
    cardColor: string;
    customerId: string;
    cardNumber: string;
}
export type Time = bigint;
export interface GiftCard {
    balance: number;
    code: string;
}
export interface backendInterface {
    activateCardDevice(code: string, orderId: bigint): Promise<void>;
    addCardBalance(cardId: string, amount: number): Promise<{
        __kind__: "ok";
        ok: CustomerCard;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addCustomCreditCard(identifier: string, qrPayload: string): Promise<void>;
    addMenuItem(name: string, price: number, category: string | null): Promise<void>;
    addRewardPoints(username: string, amount: bigint): Promise<void>;
    clearPairingCode(code: string): Promise<void>;
    completeTransaction(items: Array<MenuItem>, total: number, paymentMethod: string): Promise<void>;
    createWPayOrder(customerName: string, items: Array<MenuItem>, total: number): Promise<string>;
    deleteCustomerCard(cardId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    editMenuItem(index: bigint, name: string, price: number, category: string | null): Promise<void>;
    generateCustomerCard(username: string, password: string, cardName: string, cardColor: string): Promise<{
        __kind__: "ok";
        ok: CustomerCard;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generatePairingCode(): Promise<string>;
    generatePaymentCode(customerName: string, items: Array<MenuItem>, total: number): Promise<string>;
    getAllCustomerCards(): Promise<Array<CustomerCard>>;
    getCustomerCards(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: Array<CustomerCard>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCustomerOrders(): Promise<Array<CustomerOrder>>;
    getCustomerProfile(username: string): Promise<{
        __kind__: "ok";
        ok: {
            cards: Array<CustomerCard>;
            orders: Array<CustomerOrder>;
            points: bigint;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    getDailySalesSummary(): Promise<{
        topItems: Array<{
            name: string;
            quantity: bigint;
        }>;
        orderCount: bigint;
        totalRevenue: number;
    }>;
    getGiftCard(code: string): Promise<GiftCard>;
    getMenu(): Promise<Array<MenuItem>>;
    getMenuByCategory(): Promise<Array<MenuItem>>;
    getOrderByPaymentCode(code: string): Promise<CustomerOrder | null>;
    getPairingCart(code: string): Promise<{
        status: string;
        total: number;
        orderId?: bigint;
        items: Array<MenuItem>;
    } | null>;
    getPairingStatus(code: string): Promise<{
        __kind__: "active";
        active: boolean;
    } | {
        __kind__: "notFound";
        notFound: null;
    }>;
    getRewardPoints(username: string): Promise<bigint>;
    issueGiftCard(code: string, balance: number): Promise<void>;
    lookupWPayOrder(code: string): Promise<CustomerOrder | null>;
    markOrderPaidByCode(code: string): Promise<void>;
    markPairingCodeUsed(code: string): Promise<void>;
    markPairingPaid(code: string): Promise<void>;
    markWPayOrderPaid(code: string): Promise<void>;
    payWithCustomerCard(cardId: string, amount: number, username: string, password: string): Promise<{
        __kind__: "ok";
        ok: CustomerCard;
    } | {
        __kind__: "err";
        err: string;
    }>;
    placeCustomerOrder(customerName: string, items: Array<MenuItem>, total: number): Promise<bigint>;
    processCardDevicePayment(code: string, cardNumber: string, cardName: string, expiryDate: string, cvv: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    redeemForGiftCard(username: string, cardName: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    redeemRewardPoints(points: bigint): Promise<boolean>;
    removeMenuItem(index: bigint): Promise<void>;
    setPairingOrder(code: string, orderId: bigint): Promise<void>;
    signIn(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    signUp(username: string, password: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrderStatus(id: bigint, status: string, paymentMethod: string | null): Promise<void>;
    updatePairingCart(code: string, items: Array<MenuItem>, total: number): Promise<void>;
    useGiftCard(code: string, amount: number): Promise<void>;
    validateCustomCreditCard(qrPayload: string): Promise<string>;
    validatePairingCode(code: string): Promise<boolean>;
}
