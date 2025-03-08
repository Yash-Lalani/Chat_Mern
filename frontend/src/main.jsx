import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from "./store"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Provider store={store}>  {/* ✅ Now store is defined */}
        <App />
      </Provider>
    </Router>
  </StrictMode>,
);
