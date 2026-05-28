<script lang="ts">
  import { transactions, showAddModal, editingTransaction } from "../store";
  import type { Transaction } from "../types";

  let searchQuery = $state<string>("");
  let typeFilter = $state<"all" | "income" | "expense">("all");
  let selectedMonth = $state<string>("all"); // format: 'YYYY-MM'

  // Get unique months present in transactions for month filter
  const transactionMonths = $derived.by(() => {
    const months = new Set<string>();
    $transactions.forEach((tx) => {
      months.add(tx.date.substring(0, 7)); // get 'YYYY-MM'
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  });

  // Filtered transactions
  const filteredTransactions = $derived.by(() => {
    return $transactions.filter((tx) => {
      // 1. Type Filter
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // 2. Month Filter
      if (selectedMonth !== "all" && !tx.date.startsWith(selectedMonth)) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const noteMatch = tx.note.toLowerCase().includes(query);
        const catMatch = tx.category.toLowerCase().includes(query);
        const amtMatch = tx.amount.toString().includes(query);
        if (!noteMatch && !catMatch && !amtMatch) {
          return false;
        }
      }

      return true;
    });
  });

  // Group filtered transactions by Date
  interface GroupedTransactions {
    dateLabel: string;
    items: Transaction[];
  }

  const groupedTransactions = $derived.by(() => {
    const groups: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((tx) => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0])) // sort dates descending
      .map(([date, items]): GroupedTransactions => {
        const dateObj = new Date(date + "T00:00:00");
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        return {
          dateLabel: formattedDate,
          items,
        };
      });
  });

  function editTransaction(tx: Transaction) {
    $editingTransaction = tx;
    $showAddModal = true;
  }

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  }

  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split("-");
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
</script>

<div class="history-container">
  <!-- Search and Filtering Header -->
  <div class="filter-header">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Search notes, categories..."
        class="search-input-field"
        bind:value={searchQuery}
      />
      {#if searchQuery}
        <button class="clear-search" onclick={() => (searchQuery = "")}
          >✕</button
        >
      {/if}
    </div>

    <div class="filters-row">
      <!-- Type Filter Pills -->
      <div class="type-pills">
        <button
          class="pill"
          class:active={typeFilter === "all"}
          onclick={() => (typeFilter = "all")}>All</button
        >
        <button
          class="pill"
          class:active={typeFilter === "income"}
          onclick={() => (typeFilter = "income")}>Income</button
        >
        <button
          class="pill"
          class:active={typeFilter === "expense"}
          onclick={() => (typeFilter = "expense")}>Expenses</button
        >
      </div>

      <!-- Month Filter Select -->
      <div class="month-select-wrapper">
        <select
          class="month-select"
          bind:value={selectedMonth}
          aria-label="Filter by month"
        >
          <option value="all">All Time</option>
          {#each transactionMonths as month}
            <option value={month}>{formatMonthLabel(month)}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>

  <!-- Transaction List -->
  <div class="list-section">
    {#if groupedTransactions.length === 0}
      <div class="empty-state">
        <p>No transactions match your filters.</p>
      </div>
    {:else}
      {#each groupedTransactions as group}
        <div class="group-header">{group.dateLabel}</div>
        <div class="list-group list-spacing">
          {#each group.items as tx}
            <button
              class="list-item clickable-item"
              onclick={() => editTransaction(tx)}
            >
              <div class="item-left">
                <div class="item-icon-wrapper {tx.type}">
                  {#if tx.type === "income"}
                    ↓
                  {:else}
                    ↑
                  {/if}
                </div>
                <div class="item-info">
                  <span class="item-title">{tx.note || tx.category}</span>
                  <span class="item-category">{tx.category}</span>
                </div>
              </div>
              <div class="item-right">
                <span
                  class="item-amount"
                  class:income={tx.type === "income"}
                  class:expense={tx.type === "expense"}
                >
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .history-container {
    padding: 1rem;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .filter-header {
    margin-bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 0.9rem;
    color: var(--text-secondary);
    pointer-events: none;
  }

  .search-input-field {
    width: 100%;
    padding: 0.65rem 2rem 0.65rem 2.25rem;
    border: none;
    border-radius: 10px;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    border: 1px solid var(--border-color);
  }

  .search-input-field:focus {
    border-color: var(--color-accent);
  }

  .clear-search {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
  }

  .filters-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .type-pills {
    display: flex;
    gap: 6px;
    background-color: var(--bg-secondary);
    padding: 3px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
  }

  .pill {
    padding: 0.4rem 0.75rem;
    border: none;
    background: none;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pill.active {
    background-color: var(--color-accent);
    color: #ffffff;
  }

  .month-select-wrapper {
    position: relative;
  }

  .month-select {
    padding: 0.45rem 1.75rem 0.45rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .month-select-wrapper::after {
    content: "▼";
    font-size: 0.6rem;
    color: var(--text-secondary);
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  /* Group list elements */
  .list-section {
    flex-grow: 1;
  }

  .group-header {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-secondary);
    margin: 1.25rem 0.5rem 0.5rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .list-spacing {
    margin-bottom: 0.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-card);
    border: 1px dashed var(--border-color);
    margin-top: 1rem;
  }

  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    font-size: 0.88rem;
    color: var(--text-secondary);
  }

  /* List items */
  .clickable-item {
    width: 100%;
    border: none;
    background-color: var(--bg-secondary);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease;
  }

  .clickable-item:active {
    background-color: var(--bg-tertiary);
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .item-icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .item-icon-wrapper.income {
    background-color: var(--color-income-light);
    color: var(--color-income);
  }

  .item-icon-wrapper.expense {
    background-color: var(--color-expense-light);
    color: var(--color-expense);
  }

  .item-info {
    display: flex;
    flex-direction: column;
  }

  .item-title {
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
    text-transform: capitalize;
  }

  .item-category {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: capitalize;
  }

  .item-right {
    font-family: var(--font-heading);
    font-weight: 700;
  }

  .item-amount {
    font-size: 0.95rem;
  }

  .item-amount.income {
    color: var(--color-income);
  }

  .item-amount.expense {
    color: var(--text-primary);
  }
</style>
