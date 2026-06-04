<script lang="ts">
  import { transactions } from "../store";
  import type { Transaction } from "../types";

  // Default to current month (YYYY-MM)
  let selectedMonth = $state<string>(new Date().toISOString().substring(0, 7));

  // Extract unique months from transactions for dropdown options
  const availableMonths = $derived.by(() => {
    const months = new Set<string>();
    // Always include current month in options
    months.add(new Date().toISOString().substring(0, 7));
    $transactions.forEach((tx) => {
      months.add(tx.date.substring(0, 7));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  });

  // Filter transactions for chosen month
  const monthlyTransactions = $derived(
    $transactions.filter((tx) => tx.date.startsWith(selectedMonth)),
  );

  // Compute stats
  const totals = $derived.by(() => {
    let income = 0;
    let expense = 0;
    monthlyTransactions.forEach((tx) => {
      if (tx.type === "income") {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    return {
      income,
      expense,
      balance: income - expense,
      savingsRate:
        income > 0
          ? Math.max(0, Math.round(((income - expense) / income) * 100))
          : income - expense > 0
            ? 100
            : 0,
    };
  });

  // Group expenses by category
  interface CategoryTotal {
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }

  const categoryTotals = $derived.by((): CategoryTotal[] => {
    const groups: Record<string, { amount: number; count: number }> = {};
    let totalExpense = 0;

    monthlyTransactions.forEach((tx) => {
      if (tx.type === "expense") {
        if (!groups[tx.category]) {
          groups[tx.category] = { amount: 0, count: 0 };
        }
        groups[tx.category].amount += tx.amount;
        groups[tx.category].count += 1;
        totalExpense += tx.amount;
      }
    });

    return Object.entries(groups)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage:
          totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  // Compute average daily expense
  const dailyAverage = $derived.by(() => {
    if (totals.expense === 0) return 0;
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;

    let daysCount = 30;
    if (isCurrentMonth) {
      daysCount = now.getDate();
    } else {
      // Days in specific month
      daysCount = new Date(year, month, 0).getDate();
    }
    return Math.round(totals.expense / Math.max(daysCount, 1));
  });

  // Find highest single expense
  const highestExpense = $derived.by((): Transaction | null => {
    const expenses = monthlyTransactions.filter((tx) => tx.type === "expense");
    if (expenses.length === 0) return null;
    return expenses.reduce(
      (max, tx) => (tx.amount > max.amount ? tx : max),
      expenses[0],
    );
  });

  // Formatting utilities
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

  function formatShortDate(dateStr: string): string {
    const dateObj = new Date(dateStr + "T00:00:00");
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  // Get insight feedback message
  const savingsFeedback = $derived.by(() => {
    const rate = totals.savingsRate;
    const bal = totals.balance;
    if (bal < 0) {
      return {
        title: "Defisit Terdeteksi",
        text: "Pengeluaran melebihi pemasukan bulan ini. Evaluasi kembali kebutuhan utama Anda.",
        class: "danger",
      };
    }
    if (rate >= 50) {
      return {
        title: "Super Saver! 🌟",
        text: "Anda menabung lebih dari setengah pendapatan! Sangat luar biasa dalam mengelola keuangan.",
        class: "success",
      };
    }
    if (rate >= 20) {
      return {
        title: "Kondisi Keuangan Sehat 👍",
        text: "Rasio tabungan Anda aman di atas 20%. Pertahankan disiplin keuangan ini!",
        class: "success",
      };
    }
    return {
      title: "Tabungan Minimal 📈",
      text: "Anda menabung di bawah 20%. Cobalah menekan pengeluaran non-esensial bulan depan.",
      class: "warning",
    };
  });

  function printReport() {
    window.print();
  }

  function exportAsText() {
    let reportContent = `======================================\n`;
    reportContent += `  LAPORAN BULANAN QUICKBUDGET - ${formatMonthLabel(selectedMonth).toUpperCase()}\n`;
    reportContent += `======================================\n\n`;
    reportContent += `RINGKASAN KEUANGAN:\n`;
    reportContent += `- Total Pemasukan  : ${formatCurrency(totals.income)}\n`;
    reportContent += `- Total Pengeluaran : ${formatCurrency(totals.expense)}\n`;
    reportContent += `- Saldo Bersih      : ${formatCurrency(totals.balance)}\n`;
    reportContent += `- Tingkat Tabungan  : ${totals.savingsRate}%\n\n`;

    reportContent += `STATUS ANGGARAN:\n`;
    reportContent += `[${savingsFeedback.title}]\n`;
    reportContent += `${savingsFeedback.text}\n\n`;

    reportContent += `BREAKDOWN PENGELUARAN KATEGORI:\n`;
    if (categoryTotals.length === 0) {
      reportContent += `(Tidak ada transaksi pengeluaran)\n`;
    } else {
      categoryTotals.forEach((cat) => {
        reportContent += `- ${cat.category.toUpperCase()}: ${formatCurrency(cat.amount)} (${cat.percentage}%) - ${cat.count} Transaksi\n`;
      });
    }
    reportContent += `\n`;

    reportContent += `INFORMASI TAMBAHAN:\n`;
    reportContent += `- Rata-rata Pengeluaran Harian: ${formatCurrency(dailyAverage)}\n`;
    if (highestExpense) {
      reportContent += `- Pengeluaran Tertinggi       : ${formatCurrency(highestExpense.amount)} (${highestExpense.note || highestExpense.category} - ${formatShortDate(highestExpense.date)})\n`;
    }

    reportContent += `\n======================================\n`;
    reportContent += `Dibuat secara otomatis oleh QuickBudget PWA\n`;

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickBudget-Laporan-${selectedMonth}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="report-container">
  <!-- Month Selector Card -->
  <div class="selector-card card">
    <div class="selector-label">PILIH BULAN LAPORAN</div>
    <div class="month-select-wrapper full-width">
      <select
        class="month-select-large"
        bind:value={selectedMonth}
        aria-label="Select report month"
      >
        {#each availableMonths as month}
          <option value={month}>{formatMonthLabel(month)}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if monthlyTransactions.length === 0}
    <div class="empty-report card">
      <div class="empty-icon"></div>
      <p class="empty-text">
        Tidak ada transaksi yang tercatat pada bulan {formatMonthLabel(
          selectedMonth,
        )}.
      </p>
    </div>
  {:else}
    <!-- Financial Summary Board -->
    <div class="summary-grid">
      <div class="summary-tile card">
        <span class="tile-label">PEMASUKAN</span>
        <span class="tile-value text-income"
          >{formatCurrency(totals.income)}</span
        >
      </div>
      <div class="summary-tile card">
        <span class="tile-label">PENGELUARAN</span>
        <span class="tile-value text-expense"
          >{formatCurrency(totals.expense)}</span
        >
      </div>
    </div>

    <!-- Savings Rate Card -->
    <div class="savings-card card">
      <div class="savings-header">
        <span class="savings-title">Tingkat Tabungan (Savings Rate)</span>
        <span class="savings-value">{totals.savingsRate}%</span>
      </div>
      <div class="progress-bar-bg">
        <div
          class="progress-bar-fill"
          style="width: {totals.savingsRate}%"
        ></div>
      </div>
      <div class="savings-feedback {savingsFeedback.class}">
        <div class="feedback-title">{savingsFeedback.title}</div>
        <div class="feedback-text">{savingsFeedback.text}</div>
      </div>
    </div>

    <!-- Category Breakdown Card -->
    <div class="category-breakdown card">
      <h3 class="card-section-title">Breakdown Pengeluaran</h3>
      {#if categoryTotals.length === 0}
        <p class="empty-subtext">Tidak ada pengeluaran di bulan ini.</p>
      {:else}
        <div class="breakdown-list">
          {#each categoryTotals as cat}
            <div class="breakdown-item">
              <div class="item-header">
                <span class="category-name">{cat.category}</span>
                <span class="category-sum"
                  >{formatCurrency(cat.amount)}
                  <small class="text-muted">({cat.percentage}%)</small></span
                >
              </div>
              <div class="category-bar-bg">
                <div
                  class="category-bar-fill"
                  style="width: {cat.percentage}%"
                ></div>
              </div>
              <div class="item-footer">
                <span>{cat.count} Transaksi</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Additional Insights Grid -->
    <div class="insights-grid">
      <!-- Daily Average -->
      <div class="insight-card card">
        <div class="insight-label">RATA-RATA HARIAN</div>
        <div class="insight-value">{formatCurrency(dailyAverage)}</div>
        <div class="insight-desc">
          Dihitung berdasarkan hari berlalu/jumlah hari di bulan ini.
        </div>
      </div>

      <!-- Highest Single Expense -->
      {#if highestExpense}
        <div class="insight-card card">
          <div class="insight-label">PENGELUARAN TERTINGGI</div>
          <div class="insight-value text-danger">
            {formatCurrency(highestExpense.amount)}
          </div>
          <div class="insight-desc">
            <strong>{highestExpense.note || highestExpense.category}</strong>
            ({highestExpense.category}) pada {formatShortDate(
              highestExpense.date,
            )}.
          </div>
        </div>
      {/if}
    </div>

    <!-- Download & Print Actions -->
    <div class="actions-card card report-actions">
      <h3 class="card-section-title">Unduh & Cetak</h3>
      <div class="actions-row">
        <button class="btn btn-primary action-btn" onclick={exportAsText}>
          Ekspor (.txt)
        </button>
        <button class="btn btn-secondary action-btn" onclick={printReport}>
          Cetak PDF
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .report-container {
    padding: 1rem;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .selector-card {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 0;
  }

  .selector-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
  }

  .month-select-wrapper.full-width {
    width: 100%;
    position: relative;
  }

  .month-select-large {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-input);
    border: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }

  .month-select-wrapper::after {
    content: "▼";
    font-size: 0.75rem;
    color: var(--text-secondary);
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .empty-report {
    text-align: center;
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }

  .empty-text {
    font-size: 0.95rem;
    color: var(--text-secondary);
  }

  /* Summary Grid */
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .summary-tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 1rem;
    margin-bottom: 0;
  }

  .tile-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.04em;
  }

  .tile-value {
    font-size: 1.1rem;
    font-weight: 700;
    font-family: var(--font-heading);
  }

  /* Savings Card */
  .savings-card {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 0;
  }

  .savings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .savings-title {
    font-size: 0.88rem;
    font-weight: 700;
  }

  .savings-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-accent);
    font-family: var(--font-heading);
  }

  .progress-bar-bg {
    height: 8px;
    border-radius: 4px;
    background-color: var(--bg-tertiary);
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background-color: var(--color-accent);
    border-radius: 4px;
    transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .savings-feedback {
    margin-top: 4px;
    padding: 0.75rem;
    border-radius: var(--border-radius-input);
  }

  .savings-feedback.success {
    background-color: var(--color-income-light);
  }

  .savings-feedback.warning {
    background-color: var(--color-accent-light);
  }

  .savings-feedback.danger {
    background-color: var(--color-expense-light);
  }

  .feedback-title {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .feedback-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 2px;
    line-height: 1.4;
  }

  /* Category breakdown */
  .category-breakdown {
    padding: 1.25rem;
    margin-bottom: 0;
  }

  .card-section-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }

  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .category-name {
    text-transform: capitalize;
  }

  .category-sum {
    font-family: var(--font-heading);
    font-weight: 700;
  }

  .text-muted {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .category-bar-bg {
    height: 6px;
    border-radius: 3px;
    background-color: var(--bg-tertiary);
    overflow: hidden;
  }

  .category-bar-fill {
    height: 100%;
    background-color: var(--color-expense);
    border-radius: 3px;
  }

  .item-footer {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-align: right;
  }

  .empty-subtext {
    font-size: 0.82rem;
    color: var(--text-secondary);
    text-align: center;
    padding: 1rem 0;
  }

  /* Insights Grid */
  .insights-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .insight-card {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 0;
  }

  .insight-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
  }

  .insight-value {
    font-size: 1.15rem;
    font-weight: 700;
    font-family: var(--font-heading);
  }

  .text-danger {
    color: var(--color-expense);
  }

  .insight-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  /* Actions Card */
  .actions-card {
    padding: 1.25rem;
    margin-bottom: 0;
  }

  .actions-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }

  .action-btn {
    padding: 0.7rem 1rem;
    font-size: 0.85rem;
    font-weight: 700;
  }
</style>
