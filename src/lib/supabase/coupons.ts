// src/lib/supabase/coupons.ts
import { supabase } from "@lib/supabaseClient";

export type Coupon = {
  id: string;
  code: string;
  discount_pct: number;
  is_active: boolean;
};

export async function fetchCouponByCode(
  code: string
): Promise<Coupon | null> {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_pct, is_active")
    .ilike("code", normalized) // no distingue mayúsc/minúsc
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[coupons] fetchCouponByCode error:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    code: data.code,
    discount_pct: Number(data.discount_pct ?? 0),
    is_active: data.is_active,
  };
}

export async function fetchAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, discount_pct, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[coupons] fetchAllCoupons error:", error);
    return [];
  }
  return (data || []).map((c: any) => ({
    id: c.id,
    code: c.code,
    discount_pct: Number(c.discount_pct ?? 0),
    is_active: c.is_active,
  }));
}

export async function upsertCoupon(input: {
  id?: string;
  code: string;
  discount_pct: number;
  is_active: boolean;
}) {
  const payload = {
    id: input.id,
    code: input.code.trim(),
    discount_pct: input.discount_pct,
    is_active: input.is_active,
  };

  const { error } = await supabase.from("coupons").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error("[coupons] upsertCoupon error:", error);
    throw error;
  }
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[coupons] deleteCoupon error:", error);
    throw error;
  }
}
