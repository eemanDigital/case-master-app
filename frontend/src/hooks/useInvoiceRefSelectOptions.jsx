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
          value: invoice?._id,
          label: invoice?.invoiceReference,
        };
      })
    : [];
  return { invoiceRefOptions };
};

export default useInvoiceRefSelectOptions;
