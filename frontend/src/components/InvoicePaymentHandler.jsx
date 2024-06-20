import { useState } from "react";
import InvoiceList from "../pages/InvoiceList";
import Payment from "./Payment";
import SwitchButton from "./SwitchButton";
import PaymentByClient from "../pages/PaymentByClients";

const InvoicePaymentHandler = () => {
  const [selectedState, setSelectedState] = useState("payment");

  const renderSelectedState = () => {
    switch (selectedState) {
      case "payment":
        return <Payment />;

      case "payment-by-client":
        return <PaymentByClient />;

      default:
        return <InvoiceList />;
    }
  };

  return (
    <>
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="payment"
        text="Payments"
      />
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="invoice"
        text="Invoices"
      />
      <SwitchButton
        currentState={selectedState}
        updatedState={setSelectedState}
        stateText="payment-by-client"
        text="Total Payment By Clients"
      />

      {renderSelectedState()}
    </>
  );
};

export default InvoicePaymentHandler;
