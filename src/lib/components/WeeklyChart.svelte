<script lang="ts">
  import { weeklyData } from '../store';

  // Find max daily amount to scale bars proportionally
  const maxAmount = $derived(
    Math.max(
      ...$weeklyData.map(d => Math.max(d.income, d.expense)),
      10000 // minimum scale ceiling for Rupiah to prevent huge bars for tiny amounts
    )
  );

  function getHeightPercent(amount: number): string {
    if (amount === 0) return '0%';
    const pct = (amount / maxAmount) * 100;
    return `${Math.max(pct, 6)}%`; // minimum 6% height to show a sliver for small amounts
  }

  function formatAmount(amount: number): string {
    if (amount === 0) return 'Rp 0';
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}rb`;
    return `Rp ${amount}`;
  }
</script>

<div class="chart-card">
  <div class="chart-header">
    <div class="chart-title">Weekly Activity</div>
    <div class="chart-legend">
      <span class="legend-item"><span class="dot income"></span>Income</span>
      <span class="legend-item"><span class="dot expense"></span>Expense</span>
    </div>
  </div>

  <div class="chart-container">
    {#each $weeklyData as day}
      <div class="chart-col">
        <div class="bar-pair">
          <!-- Income Bar -->
          <div class="bar-wrapper">
            <div class="bar-tooltip">{formatAmount(day.income)}</div>
            <div 
              class="bar income" 
              style="height: {getHeightPercent(day.income)}"
            ></div>
          </div>
          
          <!-- Expense Bar -->
          <div class="bar-wrapper">
            <div class="bar-tooltip">{formatAmount(day.expense)}</div>
            <div 
              class="bar expense" 
              style="height: {getHeightPercent(day.expense)}"
            ></div>
          </div>
        </div>
        <div class="day-label">{day.dayLabel}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .chart-card {
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-card);
    padding: 1.25rem 1rem 1rem 1rem;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    margin-bottom: 1.25rem;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 0 0.25rem;
  }

  .chart-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .chart-legend {
    display: flex;
    gap: 12px;
  }

  .legend-item {
    font-size: 0.72rem;
    color: var(--text-secondary);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  .dot.income { background-color: var(--color-income); }
  .dot.expense { background-color: var(--color-expense); }

  .chart-container {
    height: 120px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    align-items: flex-end;
    gap: 6px;
    padding-top: 10px;
  }

  .chart-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  .bar-pair {
    display: flex;
    gap: 3px;
    height: 100px;
    width: 100%;
    align-items: flex-end;
    justify-content: center;
    position: relative;
  }

  .bar-wrapper {
    position: relative;
    height: 100%;
    width: 10px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bar.income {
    background-color: var(--color-income);
  }

  .bar.expense {
    background-color: var(--color-expense);
  }

  /* Tooltip overlay on hover */
  .bar-tooltip {
    position: absolute;
    bottom: calc(100% + 4px);
    background-color: var(--text-primary);
    color: var(--bg-secondary);
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transform: translateY(4px);
    transition: all 0.15s ease;
    box-shadow: var(--shadow-sm);
    z-index: 10;
  }

  .bar-wrapper:hover .bar-tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .day-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
</style>
