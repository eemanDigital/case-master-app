import { useEffect, useState } from "react";
import InvoiceList from "../pages/InvoiceList";
import Payment from "./Payment";
import SwitchButton from "./SwitchButton";
import PaymentByClient from "../pages/PaymentByClients";
import { useSearchParams } from "react-router-dom";

const InvoicePaymentHandler = () => {
  const [selectedState, setSelectedState] = useState("payment");
  const [searchParams, setSearchParams] = useSearchParams();

  // Update selectedState based on searchParams
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      setSelectedState(type);
    }
  }, [searchParams]);

  const renderSelectedState = () => {
    switch (selectedState) {
      case "payment":
        return <Payment />;

      case "payment-by-client":
        return <PaymentByClient />;

      case "invoice":
        return <InvoiceList />;

      default:
        return <Payment />; // Default to Payment if none of the cases match
    }
  };

  return (
    <div className="m-5">
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="payment"
        text="Payments"
        onClick={() => setSearchParams({ type: "payment" })}
      />
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="invoice"
        text="Invoices"
        onClick={() => setSearchParams({ type: "invoice" })}
      />
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="payment-by-client"
        text="Total Payment By Clients"
        onClick={() => setSearchParams({ type: "payment-by-client" })}
      />

      {renderSelectedState()}
    </div>
  );
};

export default InvoicePaymentHandler;
