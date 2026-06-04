<script lang="ts">
  import { onMount } from "svelte";
  import { activePage } from "../store";
  import { fetchUserPings, supabase, type UserPing } from "../analytics";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";

  // Auth States
  let pin = $state("");
  let error = $state("");
  let isAuthenticated = $state(false);

  // Data States
  let usersList = $state<UserPing[]>([]);
  let isLoading = $state(false);
  let fetchError = $state("");
  let currentUserId = $state("");

  // Stats Derived States
  let totalUsers = $derived(usersList.length);
  
  let activeToday = $derived(
    usersList.filter((u) => {
      const lastActive = new Date(u.last_active).getTime();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return lastActive > oneDayAgo;
    }).length
  );

  let activeWeekly = $derived(
    usersList.filter((u) => {
      const lastActive = new Date(u.last_active).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return lastActive > sevenDaysAgo;
    }).length
  );

  // Check if env variable is defined, fallback to 8888 if not configured
  const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "8888";

  onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    currentUserId = user ? user.id : "";
    
    // Check if we were already authenticated in this session
    if (sessionStorage.getItem("qb_admin_auth") === "true") {
      isAuthenticated = true;
      loadStats();
    }
  });

  function goHome() {
    window.location.href = "/";
  }

  function handleAuth(e: Event) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      isAuthenticated = true;
      error = "";
      sessionStorage.setItem("qb_admin_auth", "true");
      loadStats();
    } else {
      error = "Incorrect PIN code. Please try again.";
      pin = "";
    }
  }

  async function loadStats() {
    isLoading = true;
    fetchError = "";
    try {
      usersList = await fetchUserPings();
    } catch (err: any) {
      fetchError = err.message || "Failed to connect to Supabase. Check your connection or env credentials.";
    } finally {
      isLoading = false;
    }
  }

  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return "Just now"; // Handle timezone difference slight variations
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getShortId(userId: string): string {
    return userId.substring(0, 8);
  }

  function getThemeColor(themeName: string): string {
    switch (themeName) {
      case "light": return "#007aff";
      case "dark": return "#0a84ff";
      case "cute": return "#ff7597";
      case "minimalist": return "#000000";
      case "vintage": return "#b07d62";
      case "forest": return "#40916c";
      case "cat": return "#e7a35c";
      default: return "var(--text-secondary)";
    }
  }

  function handleLogout() {
    isAuthenticated = false;
    sessionStorage.removeItem("qb_admin_auth");
    pin = "";
  }
</script>

<div class="admin-container">
  {#if !isAuthenticated}
    <!-- Auth Gate Screen -->
    <div class="auth-gate">
      <div class="auth-card">
        <div class="lock-icon">
          <FontAwesomeIcon icon="gear" style="font-size: 2rem; color: var(--color-accent);" />
        </div>
        <h2>Admin Dashboard</h2>
        <p>Please enter the administrator passcode to access user statistics.</p>
        
        <form onsubmit={handleAuth}>
          <div class="input-group">
            <input
              type="password"
              pattern="[0-9]*"
              inputmode="numeric"
              placeholder="••••••"
              bind:value={pin}
              maxlength="10"
              autocomplete="current-password"
            />
          </div>
          {#if error}
            <div class="error-msg">{error}</div>
          {/if}
          <button type="submit" class="btn-submit">Verify Passcode</button>
        </form>

        <button class="btn-back" onclick={goHome}>
          Back to Application
        </button>
      </div>
    </div>
  {:else}
    <!-- Dashboard Screen -->
    <div class="dashboard-header">
      <div>
        <h2 class="title">Developer Admin</h2>
        <p class="subtitle">Real-time usage statistics (Anonymous)</p>
      </div>
      <div class="header-actions">
        <button class="icon-btn" onclick={loadStats} disabled={isLoading} title="Refresh Stats">
          <span class:spinning={isLoading} style="display: inline-flex;">
            <FontAwesomeIcon icon="clock" />
          </span>
        </button>
        <button class="btn-logout" onclick={handleLogout}>Lock</button>
      </div>
    </div>

    {#if fetchError}
      <div class="error-banner">
        <div class="error-text">
          <strong>Database Connection Failed:</strong>
          <p>{fetchError}</p>
        </div>
        <button class="btn-retry" onclick={loadStats}>Retry Connection</button>
      </div>
    {/if}

    <!-- KPI Cards Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">Total Installs</span>
        <span class="kpi-value">{totalUsers}</span>
        <span class="kpi-desc">Unique browsers generated</span>
      </div>
      <div class="kpi-card accent">
        <span class="kpi-title">Active Today</span>
        <span class="kpi-value">{activeToday}</span>
        <span class="kpi-desc">Last active within 24h</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">Active Weekly</span>
        <span class="kpi-value">{activeWeekly}</span>
        <span class="kpi-desc">Last active within 7d</span>
      </div>
    </div>

    <!-- Users List Section -->
    <div class="users-section">
      <div class="section-header">
        <h3>User Activity Log</h3>
        {#if isLoading}
          <span class="loading-label">Updating data...</span>
        {/if}
      </div>

      {#if usersList.length === 0 && !isLoading}
        <div class="empty-state">
          No users recorded yet. Ensure Supabase is configured and RLS policies are added.
        </div>
      {:else}
        <div class="table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Device Info</th>
                <th>Theme</th>
                <th>TX Count</th>
                <th>Last Active</th>
                <th>First Seen</th>
              </tr>
            </thead>
            <tbody>
              {#each usersList as user}
                <tr class:current-user={user.user_id === currentUserId}>
                  <td class="user-id-cell">
                    <span>#{getShortId(user.user_id)}</span>
                    {#if user.user_id === currentUserId}
                      <span class="badge self">You</span>
                    {/if}
                  </td>
                  <td class="device-cell">{user.device_info || "Unknown"}</td>
                  <td class="theme-cell">
                    <span 
                      class="theme-dot" 
                      style="background-color: {getThemeColor(user.theme_used)};"
                    ></span>
                    <span class="theme-name">{user.theme_used || "light"}</span>
                  </td>
                  <td class="tx-cell">
                    <span class="badge tx-count" class:has-data={user.tx_count > 0}>
                      {user.tx_count || 0} tx
                    </span>
                  </td>
                  <td class="time-cell highlight-time">{formatRelativeTime(user.last_active)}</td>
                  <td class="time-cell">{formatDate(user.first_seen)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <div class="dashboard-footer">
      <button class="btn-footer-back" onclick={goHome}>
        Return to Application
      </button>
    </div>
  {/if}
</div>

<style>
  .admin-container {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow-y: auto;
    background-color: var(--bg-primary);
  }

  /* Auth Gate Styles */
  .auth-gate {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    padding: 1rem;
  }

  .auth-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2.25rem 1.75rem;
    text-align: center;
    max-width: 360px;
    width: 100%;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  }

  .lock-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem auto;
  }

  .auth-card h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .auth-card p {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }

  .input-group input {
    width: 100%;
    padding: 0.875rem;
    border-radius: 12px;
    border: 1.5px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1.25rem;
    text-align: center;
    letter-spacing: 0.25em;
    margin-bottom: 0.75rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .input-group input:focus {
    border-color: var(--color-accent);
  }

  .error-msg {
    color: var(--color-expense);
    font-size: 0.8rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .btn-submit {
    width: 100%;
    padding: 0.875rem;
    border-radius: 12px;
    border: none;
    background-color: var(--color-accent);
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.95rem;
    transition: opacity 0.2s ease;
  }

  .btn-submit:active {
    opacity: 0.85;
  }

  .btn-back {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.85rem;
    cursor: pointer;
    margin-top: 1.25rem;
    text-decoration: underline;
  }

  /* Dashboard Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
  }

  .dashboard-header .title {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
  }

  .dashboard-header .subtitle {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 2px 0 0 0;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .icon-btn {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-primary);
  }

  .icon-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-logout {
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  /* Error Banner */
  .error-banner {
    background-color: rgba(255, 69, 58, 0.1);
    border: 1px solid rgba(255, 69, 58, 0.2);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .error-text {
    font-size: 0.85rem;
    color: var(--color-expense);
  }

  .error-text strong {
    font-weight: 700;
  }

  .error-text p {
    margin: 4px 0 0 0;
    opacity: 0.9;
  }

  .btn-retry {
    padding: 6px 12px;
    background-color: var(--color-expense);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 1.5rem;
  }

  .kpi-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .kpi-card.accent {
    border-color: var(--color-accent);
    background-color: var(--bg-secondary);
  }

  .kpi-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .kpi-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 4px 0;
  }

  .kpi-desc {
    font-size: 0.7rem;
    color: var(--text-secondary);
    opacity: 0.8;
  }

  /* Users Section */
  .users-section {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 250px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .loading-label {
    font-size: 0.75rem;
    color: var(--color-accent);
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.85rem;
    padding: 3rem 1.5rem;
    opacity: 0.8;
    line-height: 1.4;
  }

  /* User Table */
  .table-wrapper {
    overflow-x: auto;
    flex-grow: 1;
  }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .user-table th, .user-table td {
    padding: 0.75rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .user-table th {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .user-id-cell {
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .device-cell {
    color: var(--text-secondary);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .theme-cell {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .theme-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .theme-name {
    font-size: 0.75rem;
    text-transform: capitalize;
  }

  .time-cell {
    color: var(--text-secondary);
  }

  .highlight-time {
    color: var(--color-accent);
    font-weight: 500;
  }

  .badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.65rem;
    font-weight: 700;
  }

  .badge.self {
    background-color: var(--color-accent-light);
    color: var(--color-accent);
  }

  .badge.tx-count {
    background-color: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .badge.tx-count.has-data {
    background-color: var(--color-income-light);
    color: var(--color-income);
  }

  tr.current-user {
    background-color: rgba(0, 122, 255, 0.03);
  }

  /* Animations */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  /* Footer */
  .dashboard-footer {
    margin-top: 1.5rem;
    text-align: center;
  }

  .btn-footer-back {
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border-color);
  }

  .btn-footer-back:active {
    background-color: var(--bg-tertiary);
  }
</style>
