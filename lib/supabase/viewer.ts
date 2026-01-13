import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function getViewerId() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Supabase auth error while resolving viewer", error);
      return null;
    }

    return user?.id ?? null;
  } catch (authError) {
    console.error("Failed to initialize Supabase client for viewer lookup", authError);
    return null;
  }
}


