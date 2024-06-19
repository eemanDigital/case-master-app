import { useDataGetterHook } from "./useDataGetterHook";

const useInvoiceRefSelectOptions = () => {
  const { invoices } = useDataGetterHook();

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
