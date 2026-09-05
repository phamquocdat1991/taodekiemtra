import { createClient } from "@supabase/supabase-js";

const fallbackUrl = `${window.location.origin}/supabase`;
const fallbackPublishableKey = "sb_publishable_F-hkqEoZ4mSadck6DCrYpg_oKMmeLji";

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || fallbackUrl;
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || fallbackPublishableKey;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    persistSession: true,
  },
});

export async function invokeFunction<T>(
  name: "generate-content" | "room-api",
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (error) {
    let message = error.message;
    const context = (error as any).context;
    if (context instanceof Response) {
      const payload = await context.clone().json().catch(() => null);
      message = payload?.message || message;
    }
    throw new Error(message);
  }
  if (data == null) throw new Error("Máy chủ không trả về dữ liệu.");
  return data;
}
