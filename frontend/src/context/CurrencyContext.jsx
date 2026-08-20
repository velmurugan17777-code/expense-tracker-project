/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const CurrencyContext = createContext();
export const useCurrency = () => useContext(CurrencyContext);

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
};

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState({ USD: 1 });

  useEffect(() => {
    // Load user's currency from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.currency) {
        setCurrency(parsedUser.currency);
      }
    }
    // Fetch exchange rates
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await api.get('/accounts/exchange-rates/');
      setRates(response.data.rates);
    } catch (e) {
      console.error('Failed to fetch exchange rates', e);
    }
  };

  const format = (amountInUSD) => {
    const rate = rates[currency] || 1;
    const converted = parseFloat(amountInUSD || 0) * rate;
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${symbol}${converted.toFixed(2)}`;
  };

  const changeCurrency = async (newCurrency) => {
    setCurrency(newCurrency);
    // Update user stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      parsedUser.currency = newCurrency;
      localStorage.setItem('user', JSON.stringify(parsedUser));
    }
    // Persist to backend
    try {
      await api.patch('/accounts/profile/', { currency: newCurrency });
    } catch (e) {
      console.error('Failed to save currency preference', e);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, format, changeCurrency, SUPPORTED_CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};
