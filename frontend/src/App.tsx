import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { AuctionPage } from './components/AuctionPage';
import { AuctionDetailPage } from './components/AuctionDetailPage';
import './App.css';

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated() ? <Navigate to="/auctions" /> : <LoginPage />}
          />
          <Route
            path="/auctions"
            element={isAuthenticated() ? <AuctionPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/auction/:id"
            element={isAuthenticated() ? <AuctionDetailPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated() ? "/auctions" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
