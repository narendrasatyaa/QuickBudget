import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

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

