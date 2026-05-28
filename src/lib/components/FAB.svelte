<script lang="ts">
  import { showAddModal } from '../store';

  function openModal() {
    $showAddModal = true;
  }
</script>

<button class="fab" onclick={openModal} aria-label="Add transaction">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
</button>

<style>
  .fab {
    position: fixed;
    bottom: calc(var(--nav-height) + 1.25rem + env(safe-area-inset-bottom));
    right: calc(50% - 250px + 1.25rem); /* Lock to bottom right of our max-width: 500px container */
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background-color: var(--color-accent);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 900;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease;
  }

  /* Responsive FAB adjustment */
  @media (max-width: 500px) {
    .fab {
      right: 1.25rem;
    }
  }

  .fab:active {
    transform: scale(0.9) rotate(90deg);
    background-color: #0056b3;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
  }

  svg {
    width: 24px;
    height: 24px;
  }
</style>
