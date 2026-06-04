import { mount } from 'svelte'
import { inject } from '@vercel/analytics'
import './app.css'
import App from './App.svelte'

// Inject Vercel Analytics
inject({
  mode: import.meta.env.DEV ? 'development' : 'production'
})


// Listen for service worker updates and reload the page automatically
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

