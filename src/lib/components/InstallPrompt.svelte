<script lang="ts">
  import { onMount } from "svelte";
  import { installPrompt } from "../store";

  let showPrompt = $state(false);
  let isIOS = $state(false);
  let dismissed = $state(false);

  onMount(() => {
    // Check if dismissed previously this session
    if (sessionStorage.getItem("qb-install-dismissed") === "true") {
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    isIOS = /ipad|iphone|ipod/.test(userAgent);

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    // Show custom prompt if NOT standalone and (iOS or we have the deferred prompt event)
    setTimeout(() => {
      if (!isStandalone && !dismissed) {
        if (isIOS || $installPrompt) {
          showPrompt = true;
        }
      }
    }, 3000); // Delay display to not annoy user immediately
  });

  async function triggerInstall() {
    if ($installPrompt) {
      $installPrompt.prompt();
      const { outcome } = await $installPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      $installPrompt = null;
      closePrompt();
    }
  }

  function closePrompt() {
    showPrompt = false;
    dismissed = true;
    sessionStorage.setItem("qb-install-dismissed", "true");
  }
</script>

{#if showPrompt && !dismissed}
  <div class="install-banner-container">
    <div class="install-banner">
      <div class="banner-body">
        <div class="app-icon">
          <img src="icons/icon-192.png" alt="QuickBudget Icon" />
        </div>
        <div class="banner-text">
          <h4>Install QuickBudget</h4>
          <p>
            Add to your home screen for quick offline access, full screen mode,
            and better speeds.
          </p>
        </div>
      </div>

      <div class="banner-actions">
        {#if isIOS}
          <div class="ios-instructions">
            Tap the share icon <span class="share-icon">⎋</span> then select
            <strong>Add to Home Screen</strong>
          </div>
        {:else}
          <button class="btn-install" onclick={triggerInstall}>Install</button>
        {/if}
        <button
          class="btn-close"
          onclick={closePrompt}
          aria-label="Close prompt">✕</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .install-banner-container {
    position: fixed;
    bottom: calc(var(--nav-height) + 1rem + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    max-width: 468px;
    z-index: 995;
    animation: slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes slide-up-fade {
    from {
      transform: translate(-50%, 20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  .install-banner {
    background-color: var(--bg-secondary);
    border-radius: 16px;
    padding: 1rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-color);
  }

  .banner-body {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .app-icon {
    width: 48px;
    height: 48px;
    border-radius: 11px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .app-icon svg {
    width: 100%;
    height: 100%;
  }

  .banner-text h4 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 2px 0;
  }

  .banner-text p {
    font-size: 0.78rem;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  .banner-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-top: 1px solid var(--border-color);
    padding-top: 0.75rem;
  }

  .btn-install {
    background-color: var(--color-accent);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .btn-install:active {
    opacity: 0.8;
  }

  .btn-close {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.9rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .ios-instructions {
    font-size: 0.75rem;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .share-icon {
    display: inline-block;
    background-color: var(--bg-tertiary);
    padding: 0 4px;
    border-radius: 4px;
    font-weight: bold;
    color: var(--color-accent);
  }
</style>
