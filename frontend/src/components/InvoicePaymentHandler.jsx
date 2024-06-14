import { useState } from "react";
import InvoiceList from "../pages/InvoiceList";
import Payment from "./Payment";
import SwitchButton from "./SwitchButton";

const InvoicePaymentHandler = () => {
  const [selectedState, setSelectedState] = useState("payment");

  const renderSelectedState = () => {
    switch (selectedState) {
      case "payment":
        return <Payment />;

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

      {renderSelectedState()}
    </>
  );
};

export default InvoicePaymentHandler;
