import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import App from './App.tsx';
import './index.css';

// ایجاد cache برای RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// برای اشکال‌زدایی، وضعیت فعلی زبان را نمایش می‌دهیم
console.log('Initial Redux state:', store.getState().ui.language, store.getState().ui.direction);

// اعمال اولیه تنظیمات زبان به DOM قبل از رندر شدن اپلیکیشن
const initialLanguage = store.getState().ui.language;
const initialDirection = store.getState().ui.direction;

// اعمال مستقیم تنظیمات زبان به DOM
document.documentElement.dir = initialDirection;
document.documentElement.lang = initialLanguage;

if (initialDirection === 'rtl') {
  document.documentElement.classList.add('rtl');
  document.documentElement.classList.remove('ltr');
} else {
  document.documentElement.classList.add('ltr');
  document.documentElement.classList.remove('rtl');
}

console.log('Applied initial language settings to DOM:', initialLanguage, initialDirection);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <CacheProvider value={cacheRtl}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
          </BrowserRouter>
        </CacheProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// Service Worker: فقط در تولید ثبت می‌شود؛ در توسعه حذف/غیرفعال می‌کنیم تا کش مزاحم نشود
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    } else {
      // در حالت dev هر SW موجود را حذف می‌کنیم تا هات‌ریلود و WS مشکل نداشته باشند
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
        // همچنین کش‌های قبلی را پاک می‌کنیم
        if ('caches' in window) {
          caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
        }
        console.log('SW unregistered and caches cleared for dev');
      });
    }
  });
}