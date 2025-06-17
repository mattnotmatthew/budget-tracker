import React from "react";
import { BudgetProvider } from "./context/BudgetContext";
import Dashboard from "./components/Dashboard";
import "./styles/App.css";

function App() {
  return (
    <BudgetProvider>
      <div className="App">
        <header className="app-header">
          <h1>Budget vs Actual Tracker 2025</h1>
        </header>
        <main className="app-main">
          <Dashboard />
        </main>
      </div>
    </BudgetProvider>
  );
}

export default App;
