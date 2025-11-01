import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";

//hook to fetch invoice reference number
const useInvoiceRefSelectOptions = () => {
  const { invoices, fetchData } = useDataGetterHook();

  // fetch data
  useEffect(() => {
    fetchData("invoices", "invoices");
  }, []);

  const invoiceRefOptions = Array.isArray(invoices?.data)
    ? invoices?.data.map((invoice) => {
        return {
          value: invoice?._id, // Use the actual MongoDB _id (ObjectId)
          label: invoice?.invoiceNumber, // Show invoice number as label
          invoiceNumber: invoice?.invoiceNumber, // Keep for display
          clientId: invoice?.client?._id, // For auto-population
          caseId: invoice?.case?._id, // For auto-population
          balance: invoice?.balance, // For balance display
          total: invoice?.total, // For total display
        };
      })
    : [];
  return { invoiceRefOptions };
};

export default useInvoiceRefSelectOptions;
