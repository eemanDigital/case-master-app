import { useEffect } from "react";
import { useDataGetterHook } from "./useDataGetterHook";

const useInvoiceRefSelectOptions = () => {
  const { invoices, fetchData } = useDataGetterHook();

  useEffect(() => {
    fetchData("invoices", "invoices");
  }, [fetchData]);

  const invoiceRefOptions = Array.isArray(invoices?.data)
    ? invoices?.data
        .filter((inv) => inv.status !== "paid" && inv.balance > 0)
        .map((invoice) => {
        return {
          value: invoice?._id,
          label: `${invoice?.invoiceNumber} - ₦${invoice?.balance?.toLocaleString()}`,
          invoiceNumber: invoice?.invoiceNumber,
          clientId: invoice?.client?._id,
          caseId: invoice?.case?._id,
          matterId: invoice?.matter?._id,
          balance: invoice?.balance,
          total: invoice?.total,
          status: invoice?.status,
        };
      })
    : [];
  return { invoiceRefOptions };
};

export default useInvoiceRefSelectOptions;
