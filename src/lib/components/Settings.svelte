<script lang="ts">
  import { theme, transactions, clearTx, loadTransactions, activePage } from "../store";
  import * as db from "../db";
  import type { AppTheme } from "../types";
  import { supabase } from "../analytics";

  let importInput: HTMLInputElement;

  async function handleSignOut() {
    try {
      const confirm = window.confirm("Are you sure you want to sign out?");
      if (confirm) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } catch (err: any) {
      alert(`Failed to sign out: ${err.message || err}`);
    }
  }

  const themesList: {
    id: AppTheme;
    label: string;
    bg: string;
    accent: string;
    income: string;
    expense: string;
  }[] = [
    {
      id: "light",
      label: "Classic Light",
      bg: "#f2f2f7",
      accent: "#007aff",
      income: "#34c759",
      expense: "#ff3b30",
    },
    {
      id: "dark",
      label: "Classic Dark",
      bg: "#1c1c1e",
      accent: "#0a84ff",
      income: "#30d158",
      expense: "#ff453a",
    },
    {
      id: "cute",
      label: "Cute Pastel",
      bg: "#fff0f3",
      accent: "#ff7597",
      income: "#7cd197",
      expense: "#ff8b94",
    },
    {
      id: "minimalist",
      label: "Minimalist",
      bg: "#ffffff",
      accent: "#000000",
      income: "#000000",
      expense: "#000000",
    },
    {
      id: "vintage",
      label: "Vintage Warm",
      bg: "#f5eedc",
      accent: "#b07d62",
      income: "#4f772d",
      expense: "#bc4749",
    },
    {
      id: "forest",
      label: "Forest Calm",
      bg: "#e8ece9",
      accent: "#40916c",
      income: "#2d6a4f",
      expense: "#b7094c",
    },
    {
      id: "cat",
      label: "Kucing Lucu 🐾",
      bg: "#fdf6ed",
      accent: "#e7a35c",
      income: "#6d9773",
      expense: "#d96055",
    },
  ];

  function selectTheme(themeId: AppTheme) {
    $theme = themeId;
  }

  async function handleClearData() {
    const confirm = window.confirm(
      "Are you sure you want to delete all transaction data? This action cannot be undone.",
    );
    if (confirm) {
      await clearTx();
      alert("All transactions cleared successfully.");
    }
  }

  function handleExportData() {
    const list = $transactions;
    if (list.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataStr = JSON.stringify(list, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `quickbudget-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    importInput.click();
  }

  async function handleImportData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          throw new Error("Data format must be an array of transactions.");
        }

        // Validate structure briefly
        const valid = data.every(
          (item) =>
            typeof item.amount === "number" &&
            (item.type === "income" || item.type === "expense") &&
            typeof item.date === "string",
        );

        if (!valid) {
          throw new Error("Invalid transaction schema found in backup file.");
        }

        // Clear existing, then load imported items
        await clearTx();
        for (const tx of data) {
          // Remove ID to let IndexedDB generate new ones and avoid conflict
          const { id, ...cleanTx } = tx;
          await db.addTransaction(cleanTx);
        }

        await loadTransactions();
        alert(`Successfully imported ${data.length} transactions.`);
      } catch (err: any) {
        alert(`Failed to import data: ${err.message || err}`);
      }
    };

    reader.readAsText(file);
    input.value = ""; // Reset file input
  }
</script>

<div class="settings-container">
  <div class="section-title">PILIH TEMA APLIKASI</div>
  <div class="theme-grid">
    {#each themesList as th}
      <button
        class="theme-card"
        class:active={$theme === th.id}
        onclick={() => selectTheme(th.id)}
        aria-label="Select {th.label} theme"
      >
        <span class="theme-label">{th.label}</span>
        <div class="theme-preview">
          <span
            class="preview-dot"
            style="background-color: {th.bg};"
            title="Background"
          ></span>
          <span
            class="preview-dot"
            style="background-color: {th.accent};"
            title="Accent"
          ></span>
          <span
            class="preview-dot"
            style="background-color: {th.income};"
            title="Income"
          ></span>
          <span
            class="preview-dot"
            style="background-color: {th.expense};"
            title="Expense"
          ></span>
        </div>
        {#if $theme === th.id}
          <div class="active-indicator">✓</div>
        {/if}
      </button>
    {/each}
  </div>

  <div class="section-title">Data Management</div>
  <div class="list-group">
    <button class="list-item clickable" onclick={handleExportData}>
      <div>
        <div class="item-title">Export Transactions</div>
        <div class="item-desc">Save transactions to a JSON backup file</div>
      </div>
      <svg
        class="chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>

    <button class="list-item clickable" onclick={triggerImport}>
      <div>
        <div class="item-title">Import Transactions</div>
        <div class="item-desc">Restore database from a JSON backup file</div>
      </div>
      <svg
        class="chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
    <input
      type="file"
      accept=".json"
      bind:this={importInput}
      onchange={handleImportData}
      style="display: none;"
    />
  </div>

  <div class="section-title">Account</div>
  <div class="list-group">
    <button class="list-item clickable" onclick={handleSignOut}>
      <div>
        <div class="item-title">Sign Out</div>
        <div class="item-desc">Sign out of your account (data remains saved locally)</div>
      </div>
      <svg
        class="chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
    </button>
  </div>

  <div class="section-title">Destructive Actions</div>
  <div class="list-group">
    <button class="list-item clickable danger" onclick={handleClearData}>
      <div>
        <div class="item-title text-danger">Reset All Database Data</div>
        <div class="item-desc text-danger-muted">
          Delete all transactions permanently from this device
        </div>
      </div>
      <svg
        class="chevron text-danger"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  </div>

  <div class="about-section">
    <div class="app-version">QuickBudget v2.0.0</div>
    <div class="app-status">Offline Budget App</div>
  </div>
</div>

<style>
  .settings-container {
    padding: 1rem 1rem 2rem 1rem;
    overflow-y: auto;
    flex-grow: 1;
  }

  .section-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 1.5rem 0.5rem 0.5rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .item-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: left;
  }

  .item-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: left;
    margin-top: 1px;
  }

  .clickable {
    width: 100%;
    border: none;
    background: var(--bg-secondary);
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .clickable:active {
    background-color: var(--bg-tertiary);
  }

  .chevron {
    width: 18px;
    height: 18px;
    color: var(--text-secondary);
  }

  /* Danger overrides */
  .danger:active {
    background-color: var(--color-expense-light);
  }

  .text-danger {
    color: var(--color-expense) !important;
  }

  .text-danger-muted {
    color: rgba(255, 69, 58, 0.7) !important;
  }

  .about-section {
    margin-top: 3rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .app-version {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .app-status {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.7;
  }

  /* Theme Picker Grid */
  .theme-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0.5rem 0.25rem 1rem 0.25rem;
  }

  .theme-card {
    background-color: var(--bg-secondary);
    border: 1.5px solid var(--border-color);
    border-radius: 12px;
    padding: 0.85rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    outline: none;
    text-align: left;
    width: 100%;
  }

  .theme-card:active {
    transform: scale(0.96);
  }

  .theme-card.active {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-light);
  }

  .theme-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .theme-preview {
    display: flex;
    gap: 4px;
    align-items: center;
    width: 100%;
    margin-top: auto;
  }

  .preview-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .active-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;
    background-color: var(--color-accent);
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: bold;
  }
</style>
