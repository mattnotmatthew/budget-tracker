import React from "react";
import { BudgetProvider } from "./context/BudgetContext";
import AppContent from "./components/AppContent";
import "./styles/App.css";

function App() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}

export default App;
