import React from "react";
import { BudgetProvider } from "./context/BudgetContext";
import AppContent from "./components/AppContent";
import PasswordProtection from "./components/PasswordProtection";
import "./styles/App.css";

function App() {
  return (
    <PasswordProtection>
      <BudgetProvider>
        <AppContent />
      </BudgetProvider>
    </PasswordProtection>
  );
}

export default App;
