<script lang="ts">
  import { theme, transactions, clearTx, loadTransactions } from "../store";
  import * as db from "../db";

  let importInput: HTMLInputElement;

  function toggleTheme() {
    $theme = $theme === "dark" ? "light" : "dark";
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
  <div class="section-title">Preferences</div>
  <div class="list-group">
    <div class="list-item">
      <div>
        <div class="item-title">Dark Mode</div>
        <div class="item-desc">Adjust user interface color scheme</div>
      </div>
      <button
        class="toggle-btn"
        class:active={$theme === "dark"}
        onclick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        <span class="toggle-thumb"></span>
      </button>
    </div>
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
    <div class="app-version">QuickBudget v1.0.0</div>
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

  /* Custom switch toggle */
  .toggle-btn {
    width: 51px;
    height: 31px;
    border-radius: 15.5px;
    background-color: var(--bg-tertiary);
    border: none;
    position: relative;
    cursor: pointer;
    transition: background-color 0.25s ease;
    padding: 0;
  }

  .toggle-btn.active {
    background-color: #34c759;
  }

  .toggle-thumb {
    width: 27px;
    height: 27px;
    border-radius: 50%;
    background-color: #ffffff;
    position: absolute;
    top: 2px;
    left: 2px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .toggle-btn.active .toggle-thumb {
    transform: translateX(20px);
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
</style>
