<script lang="ts">
  import { onMount } from "svelte";
  import { installPrompt } from "../store";

  let show = $state(false);
  let activeTab = $state<"ios" | "android">("ios");
  let hasPrompt = $derived($installPrompt !== null);

  onMount(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(userAgent) && !("MSStream" in window);
    const isAndroid = /android/.test(userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    // Detect OS to pre-select tab
    if (isIOS) {
      activeTab = "ios";
    } else if (isAndroid) {
      activeTab = "android";
    }

    // Force mandatory installation for all devices
    if (!isStandalone) {
      show = true;
    }
  });

  async function handleAndroidInstall() {
    if ($installPrompt) {
      $installPrompt.prompt();
      const { outcome } = await $installPrompt.userChoice;
      console.log(`PWA Install Choice: ${outcome}`);
      if (outcome === "accepted") {
        $installPrompt = null;
        show = false;
      }
    }
  }
</script>

{#if show}
  <div class="overlay">
    <!-- Ambient ambient glow decoration -->
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <div class="install-card">
      <div class="app-brand">
        <div class="logo-wrapper">
          <img src="/icons/icon-192.png" alt="App Icon" class="app-icon" />
          <div class="logo-glow"></div>
        </div>
        <h1>Wajib Install Aplikasi</h1>
        <p class="subtitle">
          Untuk mendapatkan performa maksimal, akses offline, dan tampilan
          fullscreen seperti aplikasi native, silakan install QuickBudget di HP
          Anda.
        </p>
      </div>

      <!-- Segmented Control Tabs -->
      <div class="tabs-container">
        <button
          class="tab-btn"
          class:active={activeTab === "ios"}
          onclick={() => (activeTab = "ios")}
        >
          iPhone / iOS
        </button>
        <button
          class="tab-btn"
          class:active={activeTab === "android"}
          onclick={() => (activeTab = "android")}
        >
          Android
        </button>
        <!-- <button
          class="tab-btn"
          class:active={activeTab === "desktop"}
          onclick={() => (activeTab = "desktop")}
        >
          Desktop / PC
        </button> -->
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        {#if activeTab === "ios"}
          <div class="instructions-list">
            <div class="step-item">
              <span class="step-number">1</span>
              <span class="step-text">
                Ketuk tombol <strong>Bagikan (Share)</strong>
                <!-- <img src="share.png" alt="share icon" class="inline-icon" />  -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                  fill="currentColor"
                  class="inline-icon"
                  ><path d="M0 0h24v24H0V0z" fill="none" /><path
                    d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"
                  /></svg
                >
                di bar navigasi bawah Safari.
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">2</span>
              <span class="step-text">
                Geser ke bawah lalu pilih opsi <strong
                  >Tambahkan ke Layar Utama (Add to Home Screen)</strong
                > ⊕.
              </span>
            </div>
            <div class="step-item">
              <span class="step-number">3</span>
              <span class="step-text">
                Ketuk <strong>Tambah (Add)</strong> di sudut kanan atas untuk mengonfirmasi.
              </span>
            </div>
          </div>
        {:else if activeTab === "android"}
          <div class="instructions-list">
            {#if hasPrompt}
              <div class="android-native-box">
                <p class="native-desc">
                  Browser Anda mendukung instalasi cepat satu-klik!
                </p>
                <button class="btn-install-now" onclick={handleAndroidInstall}>
                  ⚡ Install Sekarang
                </button>
              </div>
            {:else}
              <div class="step-item">
                <span class="step-number">1</span>
                <span class="step-text">
                  Ketuk tombol <strong>Menu</strong> (ikon titik tiga ⋮) di pojok
                  kanan atas browser Google Chrome.
                </span>
              </div>
              <div class="step-item">
                <span class="step-number">2</span>
                <span class="step-text">
                  Pilih opsi <strong>Instal aplikasi</strong> atau
                  <strong>Tambahkan ke Layar Utama</strong>.
                </span>
              </div>
              <div class="step-item">
                <span class="step-number">3</span>
                <span class="step-text">
                  Ikuti instruksi konfirmasi pop-up yang muncul di layar HP
                  Anda.
                </span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- General PWA Tip -->
      <div class="inapp-warning">
        <span class="warning-icon"></span>
        <p class="warning-text">
          <strong>Penting:</strong> Jika Anda membuka tautan ini dari aplikasi
          media sosial (seperti Instagram, TikTok, atau LINE), silakan salin
          link dan buka langsung menggunakan browser
          <b>Safari (iOS)</b>
          atau
          <b>Chrome (Android)</b>
          .
        </p>
      </div>

      <footer class="footer-brand">QuickBudget</footer>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #050507;
    color: #f4f4f5;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9995;
    padding: 1.5rem;
    box-sizing: border-box;
    overflow-y: auto;
  }

  /* Ambient Glows */
  .ambient-glow {
    position: absolute;
    width: 250px;
    height: 250px;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.1;
    pointer-events: none;
    z-index: 1;
  }

  .glow-1 {
    background-color: #3b82f6;
    top: 10%;
    left: -50px;
  }

  .glow-2 {
    background-color: #8b5cf6;
    bottom: 10%;
    right: -50px;
  }

  /* Card */
  .install-card {
    position: relative;
    z-index: 2;
    background: rgba(24, 24, 27, 0.7);
    border: 1px solid rgba(63, 63, 70, 0.5);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 28px;
    width: 100%;
    max-width: 440px;
    padding: 2rem 1.5rem;
    box-sizing: border-box;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .app-brand {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-wrapper {
    position: relative;
    width: 72px;
    height: 72px;
    margin-bottom: 0.5rem;
    animation: float 4s ease-in-out infinite alternate;
  }

  @keyframes float {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-8px);
    }
  }

  .app-icon {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    border-radius: 18px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }

  .logo-glow {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 20px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    filter: blur(8px);
    opacity: 0.3;
    z-index: 1;
  }

  h1 {
    font-family:
      "Outfit",
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .subtitle {
    font-size: 0.82rem;
    color: #a1a1aa;
    line-height: 1.4;
    margin: 0;
  }

  /* Segmented Controls */
  .tabs-container {
    background-color: rgba(39, 39, 42, 0.6);
    border: 1px solid rgba(63, 63, 70, 0.3);
    border-radius: 14px;
    padding: 4px;
    display: flex;
    gap: 4px;
  }

  .tab-btn {
    flex: 1;
    background: none;
    border: none;
    color: #a1a1aa;
    padding: 0.6rem;
    font-size: 0.8rem;
    font-weight: 700;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tab-btn.active {
    background-color: #ffffff;
    color: #09090b;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Content area */
  .tab-content {
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .instructions-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    font-size: 0.75rem;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 2px;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .step-text {
    font-size: 0.85rem;
    color: #e4e4e7;
    line-height: 1.45;
  }

  .step-text strong {
    color: #ffffff;
  }

  .inline-icon {
    display: inline-block;
    vertical-align: middle;
    width: 16px;
    height: 16px;
    margin: 0 2px;
    opacity: 0.9;
  }

  /* Android Native Prompt Button style */
  .android-native-box {
    text-align: center;
    padding: 1.25rem 1rem;
    background: rgba(59, 130, 246, 0.05);
    border: 1px dashed rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .native-desc {
    font-size: 0.82rem;
    color: #93c5fd;
    line-height: 1.4;
    margin: 0;
  }

  .btn-install-now {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
    transition:
      transform 0.2s ease,
      filter 0.2s ease;
    animation: pulse-btn 2s infinite alternate;
  }

  @keyframes pulse-btn {
    0% {
      transform: scale(1);
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
    }
    100% {
      transform: scale(1.03);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
  }

  .btn-install-now:active {
    transform: scale(0.97);
  }

  /* In-app warning box */
  .inapp-warning {
    display: flex;
    gap: 0.6rem;
    background-color: rgba(234, 179, 8, 0.05);
    border: 1px solid rgba(234, 179, 8, 0.2);
    border-radius: 16px;
    padding: 0.75rem 1rem;
  }

  .warning-icon {
    font-size: 1.1rem;
    line-height: 1;
    margin-top: 1px;
  }

  .warning-text {
    font-size: 0.75rem;
    color: #fef08a;
    line-height: 1.4;
    margin: 0;
  }

  .footer-brand {
    font-size: 0.68rem;
    color: #52525b;
    letter-spacing: 0.08em;
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
