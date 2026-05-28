<script lang="ts">
  import { onMount } from "svelte";

  let visible = $state(true);
  let animate = $state(false);
  let fadeOut = $state(false);
  let progress = $state(0);

  onMount(() => {
    // Trigger scale animation shortly after mounting
    setTimeout(() => {
      animate = true;
    }, 50);

    // Increment progress bar to simulate loading
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress > 100) progress = 100;
      }
    }, 100);

    // Start fade out sequence
    setTimeout(() => {
      clearInterval(interval);
      progress = 100;
      fadeOut = true;
    }, 1200);

    // Completely destroy splash screen after fade-out transition ends
    setTimeout(() => {
      visible = false;
    }, 1700);
  });
</script>

{#if visible}
  <div class="splash-screen" class:fade-out={fadeOut}>
    <div class="logo-container" class:scale-up={animate}>
      <div class="logo-wrapper">
        <img src="icons/icon-192.png" alt="QuickBudget Icon" class="logo-img" />
      </div>
      <h1>QuickBudget</h1>
      <p class="subtitle">Your money, simplified.</p>
      
      <!-- Progress Bar Loader -->
      <div class="progress-container">
        <div class="progress-bar" style="width: {progress}%"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #09090b;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition:
      opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  .splash-screen.fade-out {
    opacity: 0;
    pointer-events: none;
    transform: scale(1.05);
  }

  .logo-container {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    transition:
      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .logo-container.scale-up {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .logo-wrapper {
    position: relative;
    width: 96px;
    height: 96px;
    margin-bottom: 1.5rem;
  }

  .logo-img {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-radius: 24px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
  }

  h1 {
    font-family:
      "Outfit",
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .subtitle {
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    font-size: 1rem;
    color: #a1a1aa;
    margin: 0.5rem 0 2.5rem 0;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* Progress Bar Container */
  .progress-container {
    width: 140px;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background-color: #34c759;
    border-radius: 10px;
    transition: width 0.2s cubic-bezier(0.1, 0.8, 0.2, 1);
  }
</style>
