import React from "react";
import { BudgetProvider } from "./context/BudgetContext";
import Dashboard from "./components/Dashboard";
import ExecutiveSummary from "./components/ExecutiveSummary/ExecutiveSummary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/App.css";

function App() {
  return (
    <BudgetProvider>
      <BrowserRouter>
        <div className="App">
          <header className="app-header">
            <h1>Budget vs Actual Tracker 2025</h1>
          </header>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/executive-summary" element={<ExecutiveSummary />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </BudgetProvider>
  );
}

export default App;
