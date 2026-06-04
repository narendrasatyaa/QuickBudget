<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    activePage, 
    showAddModal, 
    installPrompt, 
    loadTransactions,
    userSession,
    isAuthLoading
  } from './lib/store';
  
  // Components
  import Splash from './lib/components/Splash.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';
  import TransactionList from './lib/components/TransactionList.svelte';
  import Report from './lib/components/Report.svelte';
  import Settings from './lib/components/Settings.svelte';
  import AdminDashboard from './lib/components/AdminDashboard.svelte';
  import Auth from './lib/components/Auth.svelte';
  import FAB from './lib/components/FAB.svelte';
  import AddTransactionForm from './lib/components/AddTransactionForm.svelte';
  import InstallPrompt from './lib/components/InstallPrompt.svelte';
  import InstallOverlay from './lib/components/InstallOverlay.svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { library } from '@fortawesome/fontawesome-svg-core';
  import { faHouse, faClock, faGear, faChartPie } from '@fortawesome/free-solid-svg-icons';

  library.add(faHouse, faClock, faGear, faChartPie);

  onMount(() => {
    // 0. Check for Admin path in URL
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path === '/admin' || path === '/admin/login') {
      $activePage = 'admin';
    }

    // 1. Initialise and load transaction records from IndexedDB
    loadTransactions();

    // 2. Capture PWA installation prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      // Cache event for custom install banner trigger
      $installPrompt = e;
    });

    // 3. Optional: track when PWA installs
    window.addEventListener('appinstalled', () => {
      console.log('QuickBudget was installed successfully');
      $installPrompt = null;
    });

    // 4. Disable pinch-to-zoom on iOS Safari/Standalone
    const preventZoom = (e: TouchEvent) => {
      if ((e as any).scale !== undefined && (e as any).scale !== 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('gesturestart', preventZoom as any, { passive: false });
    document.addEventListener('gesturechange', preventZoom as any, { passive: false });
    document.addEventListener('gestureend', preventZoom as any, { passive: false });
  });

  function getPageTitle(page: string): string {
    switch(page) {
      case 'dashboard': return 'QuickBudget';
      case 'history': return 'History';
      case 'report': return 'Monthly Report';
      case 'settings': return 'Settings';
      case 'admin': return 'Admin Dashboard';
      default: return 'QuickBudget';
    }
  }
</script>

{#if $isAuthLoading}
  <!-- Splash Loading Screen while checking auth -->
  <Splash />
{:else if $activePage === 'admin'}
  <!-- Admin page has its own authentication gate inside it -->
  <AdminDashboard />
{:else if !$userSession}
  <!-- User is not logged in, show login/signup screen -->
  <Auth />
{:else}
  <!-- Main application for logged-in users -->
  <Splash />

  <!-- Unified Install Overlay -->
  <InstallOverlay />

  <header class="app-header">
    <h1 class="app-title">{getPageTitle($activePage)}</h1>
  </header>

  <main style="flex-grow: 1; display: flex; flex-direction: column; padding-bottom: calc(var(--nav-height) + 1.5rem + env(safe-area-inset-bottom));">
    {#if $activePage === 'dashboard'}
      <Dashboard />
    {:else if $activePage === 'history'}
      <TransactionList />
    {:else if $activePage === 'report'}
      <Report />
    {:else if $activePage === 'settings'}
      <Settings />
    {/if}
  </main>

  <!-- Custom PWA Install prompt -->
  <InstallPrompt />

  <!-- Floating Action Button (+), hidden on Settings page for cleaner layout -->
  {#if $activePage !== 'settings'}
    <FAB />
  {/if}

  <!-- Add/Edit Modal Form Overlay -->
  {#if $showAddModal}
    <AddTransactionForm />
  {/if}

  <!-- iOS Style Sticky Bottom Navigation -->
  <nav class="bottom-nav">
    <button 
      class="nav-btn" 
      class:active={$activePage === 'dashboard'} 
      onclick={() => $activePage = 'dashboard'}
    >
      <FontAwesomeIcon icon="house" />
      <span>Dashboard</span>
    </button>
    
    <button 
      class="nav-btn" 
      class:active={$activePage === 'history'} 
      onclick={() => $activePage = 'history'}
    >
      <FontAwesomeIcon icon="clock" />
      <span>History</span>
    </button>
    
    <button 
      class="nav-btn" 
      class:active={$activePage === 'report'} 
      onclick={() => $activePage = 'report'}
    >
      <FontAwesomeIcon icon="chart-pie" />
      <span>Report</span>
    </button>
    
    <button 
      class="nav-btn" 
      class:active={$activePage === 'settings'} 
      onclick={() => $activePage = 'settings'}
    >
      <FontAwesomeIcon icon="gear" />
      <span>Settings</span>
    </button>
  </nav>
{/if}
