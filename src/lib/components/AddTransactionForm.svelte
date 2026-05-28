<script lang="ts">
  import { onMount } from 'svelte';
  import { showAddModal, editingTransaction, addTx, updateTx, deleteTx } from '../store';
  import type { Transaction } from '../types';

  let amount = $state<string>('');
  let type = $state<'income' | 'expense'>('expense');
  let category = $state<string>('');
  let note = $state<string>('');
  let date = $state<string>('');

  const incomeCategories = ['salary', 'freelance', 'investments', 'gifts', 'other'];
  const expenseCategories = ['food', 'shopping', 'bills', 'transport', 'entertainment', 'other'];

  // Reactive logic using $derived to pick options depending on the type selected
  const activeCategories = $derived(type === 'income' ? incomeCategories : expenseCategories);

  // Reference for amount input to autofocus
  let amountInput: HTMLInputElement;

  onMount(() => {
    // Populate form if we are editing
    if ($editingTransaction) {
      amount = $editingTransaction.amount.toString();
      type = $editingTransaction.type;
      category = $editingTransaction.category;
      note = $editingTransaction.note;
      date = $editingTransaction.date;
    } else {
      // Default to today's date in local time YYYY-MM-DD
      const localDate = new Date();
      const offset = localDate.getTimezoneOffset();
      const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
      date = adjustedDate.toISOString().split('T')[0];
      category = expenseCategories[0]; // default category
    }

    // Autofocus amount input
    setTimeout(() => {
      if (amountInput) {
        amountInput.focus();
        // For mobile Safari: try to trigger keyboard focus
        amountInput.click();
      }
    }, 100);
  });

  // Watch type switch to auto-reset category to the first item of the new list
  $effect(() => {
    // Only adjust category if the current category is not in the active categories list
    if (!activeCategories.includes(category)) {
      category = activeCategories[0] || 'other';
    }
  });

  function closeModal() {
    $showAddModal = false;
    $editingTransaction = null;
  }

  async function handleSave(event: Event) {
    event.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const txData = {
      amount: parsedAmount,
      type,
      category,
      note: note.trim(),
      date,
      createdAt: $editingTransaction ? $editingTransaction.createdAt : Date.now()
    };

    try {
      if ($editingTransaction && $editingTransaction.id !== undefined) {
        await updateTx({
          ...txData,
          id: $editingTransaction.id
        });
      } else {
        await addTx(txData);
      }
      closeModal();
    } catch (err) {
      alert('Failed to save transaction. Please try again.');
    }
  }

  async function handleDelete() {
    if ($editingTransaction && $editingTransaction.id !== undefined) {
      const confirm = window.confirm('Delete this transaction?');
      if (confirm) {
        try {
          await deleteTx($editingTransaction.id);
          closeModal();
        } catch (err) {
          alert('Failed to delete transaction.');
        }
      }
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="modal-overlay" onclick={closeModal} role="dialog" aria-modal="true" tabindex="-1">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-content" onclick={(e) => e.stopPropagation()} role="document">
    <div class="modal-header">
      <h3 class="modal-title">{$editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
      <button class="close-btn" onclick={closeModal}>✕</button>
    </div>

    <form onsubmit={handleSave}>
      <!-- Amount Segment -->
      <div class="amount-container">
        <span class="currency">Rp</span>
        <input 
          type="number" 
          step="any"
          inputmode="decimal"
          placeholder="0" 
          class="amount-input" 
          bind:value={amount}
          bind:this={amountInput}
          required
        />
      </div>

      <!-- Type Selector -->
      <div class="type-selector">
        <button 
          type="button" 
          class="type-btn expense" 
          class:active={type === 'expense'} 
          onclick={() => type = 'expense'}
        >
          Expense
        </button>
        <button 
          type="button" 
          class="type-btn income" 
          class:active={type === 'income'} 
          onclick={() => type = 'income'}
        >
          Income
        </button>
      </div>

      <!-- Category Badges -->
      <div class="form-group">
        <label class="form-label" for="category-select">Category</label>
        <div class="category-grid" id="category-select">
          {#each activeCategories as cat}
            <button 
              type="button" 
              class="category-badge {cat}" 
              class:selected={category === cat}
              onclick={() => category = cat}
            >
              {cat}
            </button>
          {/each}
        </div>
      </div>

      <!-- Date Picker -->
      <div class="form-group">
        <label class="form-label" for="tx-date">Date</label>
        <input 
          type="date" 
          id="tx-date"
          class="form-input" 
          bind:value={date} 
          required
        />
      </div>

      <!-- Notes input -->
      <div class="form-group">
        <label class="form-label" for="tx-note">Note</label>
        <input 
          type="text" 
          id="tx-note"
          class="form-input" 
          placeholder="e.g. Weekly Groceries, Dinner" 
          bind:value={note}
          maxlength="100"
        />
      </div>

      <!-- Action Buttons -->
      <div class="actions-row">
        {#if $editingTransaction}
          <button type="button" class="btn btn-secondary danger-action" onclick={handleDelete}>
            Delete
          </button>
        {/if}
        <button type="submit" class="btn btn-primary submit-action">
          {$editingTransaction ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .amount-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1rem 0 2rem 0;
    font-family: var(--font-heading);
  }

  .currency {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-right: 4px;
  }

  .amount-input {
    font-size: 3.5rem;
    font-weight: 700;
    border: none;
    background: none;
    color: var(--text-primary);
    width: 240px;
    text-align: left;
    outline: none;
    font-family: var(--font-heading);
    letter-spacing: -0.02em;
  }

  /* Remove arrows on number input */
  .amount-input::-webkit-outer-spin-button,
  .amount-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .type-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    background-color: var(--bg-primary);
    padding: 4px;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border-color);
  }

  .type-btn {
    padding: 0.65rem;
    border: none;
    border-radius: 9px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    background: none;
    color: var(--text-secondary);
    transition: all 0.2s ease;
  }

  .type-btn.active.expense {
    background-color: var(--color-expense);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .type-btn.active.income {
    background-color: var(--color-income);
    color: #ffffff;
    box-shadow: var(--shadow-sm);
  }

  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 0.5rem;
  }

  .category-badge {
    padding: 0.5rem 0.85rem;
    border-radius: 20px;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1.5px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-secondary);
    cursor: pointer;
    text-transform: capitalize;
    transition: all 0.15s ease;
  }

  .category-badge:active {
    transform: scale(0.95);
  }

  /* Income & Expense selected status styling */
  .category-badge.selected {
    color: #ffffff;
    border-color: transparent;
  }

  /* Active Color Overrides per Category */
  .category-badge.selected.salary { background-color: #34c759; }
  .category-badge.selected.freelance { background-color: #007aff; }
  .category-badge.selected.investments { background-color: #af52de; }
  .category-badge.selected.gifts { background-color: #ff9500; }
  
  .category-badge.selected.food { background-color: #ff9500; }
  .category-badge.selected.shopping { background-color: #ff2d55; }
  .category-badge.selected.bills { background-color: #ff3b30; }
  .category-badge.selected.transport { background-color: #5ac8fa; }
  .category-badge.selected.entertainment { background-color: #af52de; }
  .category-badge.selected.other { background-color: #8e8e93; }

  .actions-row {
    display: flex;
    gap: 12px;
    margin-top: 2rem;
  }

  .submit-action {
    flex-grow: 1;
  }

  .danger-action {
    background-color: var(--color-expense-light);
    color: var(--color-expense);
    border: 1px solid rgba(255, 59, 48, 0.2);
  }

  .danger-action:active {
    background-color: var(--color-expense);
    color: #ffffff;
  }
</style>
