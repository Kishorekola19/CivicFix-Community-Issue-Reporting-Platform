import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><ThemeProvider><AuthProvider><App/><Toaster position="top-right" toastOptions={{className:'theme-toast'}}/></AuthProvider></ThemeProvider></BrowserRouter></React.StrictMode>);
