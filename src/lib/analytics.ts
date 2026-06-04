import { createClient } from '@supabase/supabase-js';

export interface UserPing {
  user_id: string;
  email?: string;
  first_seen: string;
  last_active: string;
  device_info: string;
  theme_used: string;
  tx_count: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Initialize Supabase Client (uses placeholders if variables are not yet configured to prevent runtime crashes)
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIn0.signature',
  {
    auth: {
      persistSession: isConfigured && typeof window !== 'undefined',
      autoRefreshToken: isConfigured && typeof window !== 'undefined',
      detectSessionInUrl: false
    }
  }
);

// Helper to parse UserAgent
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (/ipad|iphone|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/win/i.test(ua)) {
    os = 'Windows';
  } else if (/mac/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr/i.test(ua)) {
    browser = 'Opera';
  }

  return `${os} (${browser})`;
}

// Ping Supabase to report user activity (logged-in user)
export async function pingUser(theme: string, txCount: number): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only ping when logged in

    const userId = user.id;
    const email = user.email || 'no-email';
    const deviceInfo = getDeviceInfo();
    const lastActive = new Date().toISOString();

    // Use Supabase client to upsert the user ping record
    const { error } = await supabase
      .from('user_pings')
      .upsert({
        user_id: userId,
        email: email,
        last_active: lastActive,
        device_info: deviceInfo,
        theme_used: theme,
        tx_count: txCount
      });

    if (error) {
      console.error('Analytics ping failed:', error);
    }
  } catch (error) {
    console.error('Failed to send analytics ping:', error);
  }
}

// Fetch all user pings for the admin dashboard
export async function fetchUserPings(): Promise<UserPing[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing in .env.local');
  }

  try {
    const { data, error } = await supabase
      .from('user_pings')
      .select('*')
      .order('last_active', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as UserPing[];
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
}
