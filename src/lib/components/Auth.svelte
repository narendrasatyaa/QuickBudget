<script lang="ts">
  import { supabase } from "../analytics";
  import { FontAwesomeIcon } from "@fortawesome/svelte-fontawesome";

  // Form States
  let email = $state("");
  let password = $state("");
  let isSignUp = $state(false); // Mode toggler
  let isLoading = $state(false);
  let errorMsg = $state("");
  let successMsg = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    errorMsg = "";
    successMsg = "";

    if (!email || !password) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    if (password.length < 6) {
      errorMsg = "Password must be at least 6 characters long.";
      return;
    }

    isLoading = true;

    try {
      if (isSignUp) {
        // Sign Up Mode
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          successMsg = "Registration successful! Welcome.";
        } else {
          successMsg =
            "Registration successful! Please check your email for confirmation.";
        }
      } else {
        // Sign In Mode
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err: any) {
      errorMsg = err.message || "An authentication error occurred.";
    } finally {
      isLoading = false;
    }
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    errorMsg = "";
    successMsg = "";
  }
</script>

<div class="auth-container">
  <div class="auth-card animate-fade-in">
    <div class="logo-area">
      <div class="app-icon">
        <img src="icons/icon-192.png" alt="QuickBudget" class="icon-img" />
      </div>
      <h2>QuickBudget</h2>
      <p class="tagline">Manage your budget, privately and simply.</p>
    </div>

    <!-- Toggle Tabs -->
    <div class="tab-container">
      <button
        class="tab-btn"
        class:active={!isSignUp}
        onclick={() => {
          isSignUp = false;
          errorMsg = "";
          successMsg = "";
        }}
      >
        Sign In
      </button>
      <button
        class="tab-btn"
        class:active={isSignUp}
        onclick={() => {
          isSignUp = true;
          errorMsg = "";
          successMsg = "";
        }}
      >
        Sign Up
      </button>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit} class="auth-form">
      <div class="input-wrapper">
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="yourname@gmail.com"
          bind:value={email}
          required
          autocomplete="email"
          disabled={isLoading}
        />
      </div>

      <div class="input-wrapper">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          bind:value={password}
          required
          autocomplete="current-password"
          disabled={isLoading}
        />
      </div>

      {#if errorMsg}
        <div class="alert-box error-alert">
          <span class="alert-text">{errorMsg}</span>
        </div>
      {/if}

      {#if successMsg}
        <div class="alert-box success-alert">
          <span class="alert-text">{successMsg}</span>
        </div>
      {/if}

      <button type="submit" class="submit-btn" disabled={isLoading}>
        {#if isLoading}
          <span class="spinner"></span> Processing...
        {:else}
          {isSignUp ? "Create Account" : "Sign In"}
        {/if}
      </button>
    </form>

    <div class="auth-footer">
      <p>
        {isSignUp ? "Already have an account?" : "New to QuickBudget?"}
        <button class="toggle-link" onclick={toggleMode}>
          {isSignUp ? "Sign In instead" : "Create an account"}
        </button>
      </p>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    padding: 1.5rem;
    min-height: 100vh;
    background-color: var(--bg-primary);
  }

  .auth-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
  }

  .logo-area {
    text-align: center;
    margin-bottom: 2rem;
  }

  .app-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 1rem auto;
  }

  .icon-img {
    width: 100%;
    height: 100%;
    border-radius: 18px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  .logo-area h2 {
    font-family: "Outfit", sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
  }

  .tagline {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 4px 0 0 0;
    font-weight: 400;
  }

  /* Tabs */
  .tab-container {
    display: flex;
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 1.5rem;
    border: 1px solid var(--border-color);
  }

  .tab-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    background: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  /* Form */
  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-wrapper label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    padding-left: 2px;
  }

  .input-wrapper input {
    padding: 12px 16px;
    border-radius: 12px;
    border: 1.5px solid var(--border-color);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .input-wrapper input:focus {
    border-color: var(--color-accent);
  }

  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .submit-btn {
    margin-top: 0.5rem;
    padding: 12px;
    border-radius: 12px;
    border: none;
    background-color: var(--color-accent);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.2s ease;
  }

  .submit-btn:active {
    opacity: 0.85;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Alerts */
  .alert-box {
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .error-alert {
    background-color: rgba(255, 69, 58, 0.08);
    border: 1px solid rgba(255, 69, 58, 0.15);
    color: var(--color-expense);
  }

  .success-alert {
    background-color: rgba(48, 209, 88, 0.08);
    border: 1px solid rgba(48, 209, 88, 0.15);
    color: var(--color-income);
  }

  .alert-text {
    font-weight: 500;
  }

  /* Footer */
  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .auth-footer p {
    margin: 0;
  }

  .toggle-link {
    background: none;
    border: none;
    color: var(--color-accent);
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: 0.85rem;
    margin-left: 2px;
  }

  .toggle-link:hover {
    text-decoration: underline;
  }

  /* Spinner */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
