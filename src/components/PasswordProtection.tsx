import React, { useState, useEffect } from "react";
import "../styles/PasswordProtection.css";

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Set your password here - you can change this to whatever you want
  const CORRECT_PASSWORD = "budget2025"; // Change this to your desired password

  // Check if user was previously authenticated (expires after 24 hours)
  useEffect(() => {
    const authTimestamp = localStorage.getItem("budget-auth-timestamp");
    const authToken = localStorage.getItem("budget-auth-token");

    if (authTimestamp && authToken) {
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

      if (
        parseInt(authTimestamp) > twentyFourHoursAgo &&
        authToken === "authenticated"
      ) {
        setIsAuthenticated(true);
      } else {
        // Clear expired authentication
        localStorage.removeItem("budget-auth-timestamp");
        localStorage.removeItem("budget-auth-token");
      }
    }

    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === CORRECT_PASSWORD) {
      // Store authentication in localStorage (expires in 24 hours)
      localStorage.setItem("budget-auth-timestamp", Date.now().toString());
      localStorage.setItem("budget-auth-token", "authenticated");

      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("budget-auth-timestamp");
    localStorage.removeItem("budget-auth-token");
    setIsAuthenticated(false);
    setPassword("");
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="password-protection-container">
        <div className="password-protection-card">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the main app
  if (isAuthenticated) {
    return (
      <div>
        {/* Optional: Add a logout button in the corner */}
        <button className="logout-button" onClick={handleLogout} title="Logout">
          🚪
        </button>
        {children}
      </div>
    );
  }

  // Show password protection screen
  return (
    <div className="password-protection-container">
      <div className="password-protection-card">
        <div className="password-protection-header">
          <h1>🔒 Budget Tracker</h1>
          <p>This application is restricted to authorized users only.</p>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="password">Enter Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-button">
            Access Application
          </button>
        </form>

        <div className="password-protection-footer">
          <small>Access is logged and monitored.</small>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection;
