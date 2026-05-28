<script lang="ts">
  import { onMount } from "svelte";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";
  import { library } from "@fortawesome/fontawesome-svg-core";
  import { faCashRegister } from "@fortawesome/free-solid-svg-icons";
  import {
    transactions,
    summary,
    activePage,
    showAddModal,
    editingTransaction,
  } from "../store";
  import WeeklyChart from "./WeeklyChart.svelte";
  import type { Transaction } from "../types";

  // Get local date string YYYY-MM-DD
  const localDate = new Date();
  const offset = localDate.getTimezoneOffset();
  const adjustedDate = new Date(localDate.getTime() - offset * 60 * 1000);
  const todayStr = adjustedDate.toISOString().split("T")[0];

  // Derive today's transactions
  const todayTransactions = $derived(
    $transactions.filter((tx) => tx.date === todayStr),
  );

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

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }
</script>

<div class="dashboard-container">
  <!-- Greeting Segment -->
  <div class="greeting-header">
    <div class="salutation">{getGreeting()}</div>
    <div class="date-label">
      {new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}
    </div>
  </div>

  <!-- Total Balance Board -->
  <div class="balance-card">
    <div class="balance-label">Net Balance</div>
    <div class="balance-amount" class:negative={$summary.balance < 0}>
      {formatCurrency($summary.balance)}
    </div>

    <div class="flow-summary">
      <div class="flow-item">
        <div class="flow-icon income">↓</div>
        <div>
          <div class="flow-label">Income</div>
          <div class="flow-val text-income">
            {formatCurrency($summary.income)}
          </div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="flow-item">
        <div class="flow-icon expense">↑</div>
        <div>
          <div class="flow-label">Expenses</div>
          <div class="flow-val text-expense">
            {formatCurrency($summary.expense)}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Weekly Activity Chart -->
  <WeeklyChart />

  <!-- Today's Transaction Log -->
  <div class="activity-section">
    <div class="section-header">
      <h3>Today's Activity</h3>
      {#if todayTransactions.length > 0}
        <button class="see-all-btn" onclick={() => ($activePage = "history")}
          >See All</button
        >
      {/if}
    </div>

    {#if todayTransactions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-money-bill-1-wave"></i>
        </div>
        <p>No transactions logged today.</p>
        <button
          class="btn btn-secondary quick-add-btn"
          onclick={() => ($showAddModal = true)}
        >
          Log First Expense
        </button>
      </div>
    {:else}
      <div class="list-group">
        {#each todayTransactions as tx}
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
    {/if}
  </div>
</div>

<style>
  .dashboard-container {
    padding: 1rem;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .greeting-header {
    margin-bottom: 1.25rem;
    padding-left: 0.25rem;
  }

  .salutation {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text-primary);
    font-family: var(--font-heading);
    letter-spacing: -0.02em;
  }

  .date-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  /* Net Balance Board */
  .balance-card {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #ffffff;
    border-radius: var(--border-radius-card);
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  :root.dark .balance-card {
    background: linear-gradient(135deg, #1c1c1e 0%, #09090b 100%);
    border: 1px solid var(--border-color);
  }

  .balance-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .balance-amount {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0.25rem 0 1.25rem 0;
    letter-spacing: -0.03em;
    font-family: var(--font-heading);
    transition: color 0.2s ease;
  }

  .balance-amount.negative {
    color: #ff453a;
  }

  .flow-summary {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 1rem;
  }

  .divider {
    width: 1px;
    height: 32px;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .flow-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .flow-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: bold;
  }

  .flow-icon.income {
    background-color: rgba(48, 209, 88, 0.15);
    color: #30d158;
  }

  .flow-icon.expense {
    background-color: rgba(255, 69, 58, 0.15);
    color: #ff453a;
  }

  .flow-label {
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
  }

  .flow-val {
    font-size: 0.95rem;
    font-weight: 700;
    font-family: var(--font-heading);
  }

  .text-income {
    color: #30d158;
  }
  .text-expense {
    color: #ff453a;
  }

  /* Activity section */
  .activity-section {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding: 0 0.25rem;
  }

  .section-header h3 {
    font-size: 1.05rem;
    font-weight: 700;
  }

  .see-all-btn {
    background: none;
    border: none;
    color: var(--color-accent);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .see-all-btn:active {
    opacity: 0.7;
  }

  .empty-state {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2.5rem 1rem;
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-card);
    border: 1px dashed var(--border-color);
  }

  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .quick-add-btn {
    padding: 0.5rem 1rem;
    font-size: 0.82rem;
  }

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
