import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCardPaymentStore } from "@/state/cardPaymentStore";
import { useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import CardDeviceScreen from "./features/carddevice/CardDeviceScreen";
import CreditCardsScreen from "./features/creditcards/CreditCardsScreen";
import CustomerApp from "./features/customer/CustomerApp";
import CustomerAuthScreen from "./features/customer/CustomerAuthScreen";
import GiftCardsScreen from "./features/giftcards/GiftCardsScreen";
import MenuManagementScreen from "./features/menu/MenuManagementScreen";
import CustomerOrdersScreen from "./features/orders/CustomerOrdersScreen";
import PasscodeScreen from "./features/passcode/PasscodeScreen";
import POSScreen from "./features/pos/POSScreen";
import ReceiptScreen from "./features/receipts/ReceiptScreen";
import SalesScreen from "./features/sales/SalesScreen";
import TransactionsScreen from "./features/transactions/TransactionsScreen";

export type CartItem = {
  name: string;
  price: number;
  quantity: number;
  category?: string;
};

type Mode = "cashier" | "customer" | "cardDevice" | null;

function App() {
  const [mode, setMode] = useState<Mode>(null);
  const [activeTab, setActiveTab] = useState("pos");
  const [currentReceiptId, setCurrentReceiptId] = useState<string | null>(null);
  const [customerUsername, setCustomerUsername] = useState<string | null>(null);
  const [customerPassword, setCustomerPassword] = useState<string | null>(null);
  const endCashierSession = useCardPaymentStore((s) => s.endCashierSession);
  const pairingCode = useCardPaymentStore((s) => s.pairingCode);

  if (mode === null) {
    return (
      <PasscodeScreen
        onCashierUnlock={() => setMode("cashier")}
        onCustomerUnlock={() => setMode("customer")}
        onCardDeviceUnlock={() => setMode("cardDevice")}
      />
    );
  }

  if (mode === "cardDevice") {
    return <CardDeviceScreen />;
  }

  if (mode === "customer") {
    if (!customerUsername) {
      return (
        <CustomerAuthScreen
          onAuthenticated={(username, password) => {
            setCustomerUsername(username);
            setCustomerPassword(password);
          }}
        />
      );
    }
    return (
      <CustomerApp
        username={customerUsername}
        password={customerPassword ?? ""}
        onLogout={() => {
          setCustomerUsername(null);
          setCustomerPassword(null);
        }}
      />
    );
  }

  const handleCheckoutComplete = (receiptId: string) => {
    setCurrentReceiptId(receiptId);
    setActiveTab("receipt");
  };

  const handleViewReceipt = (receiptId: string) => {
    setCurrentReceiptId(receiptId);
    setActiveTab("receipt");
  };

  const handleBackToPOS = () => {
    setCurrentReceiptId(null);
    setActiveTab("pos");
  };

  const handleExitCashier = () => {
    endCashierSession();
    setMode(null);
  };

  return (
    <AppLayout pairingCode={pairingCode} onExit={handleExitCashier}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 max-w-4xl mx-auto mb-6">
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="giftcards">Gift Cards</TabsTrigger>
          <TabsTrigger value="creditcards">Cards</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="transactions">History</TabsTrigger>
          <TabsTrigger value="sales" data-ocid="sales.tab">
            Sales
          </TabsTrigger>
          <TabsTrigger value="receipt" disabled={!currentReceiptId}>
            Receipt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-0">
          <POSScreen onCheckoutComplete={handleCheckoutComplete} />
        </TabsContent>

        <TabsContent value="menu" className="mt-0">
          <MenuManagementScreen />
        </TabsContent>

        <TabsContent value="giftcards" className="mt-0">
          <GiftCardsScreen />
        </TabsContent>

        <TabsContent value="creditcards" className="mt-0">
          <CreditCardsScreen />
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <CustomerOrdersScreen />
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <TransactionsScreen onViewReceipt={handleViewReceipt} />
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          <SalesScreen />
        </TabsContent>

        <TabsContent value="receipt" className="mt-0">
          {currentReceiptId && (
            <ReceiptScreen
              receiptId={currentReceiptId}
              onBack={handleBackToPOS}
            />
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

export default App;
