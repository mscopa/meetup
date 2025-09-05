import ExternalServices from "../services/ExternalServices.mjs";
import { onDOMLoaded, select } from "../utils/helpers.js";

async function initHistoryPage() {
  const container = select("#history-container");
  try {
    const response = await ExternalServices.getMyTransactions();
    const transactions = response.data;
    // ... lógica para renderizar cada transacción con su código y estado
  } catch (error) {
    /* ... */
  }
}
onDOMLoaded(initHistoryPage);
