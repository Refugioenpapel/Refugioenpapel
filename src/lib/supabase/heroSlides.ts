// src/lib/supabase/heroSlides.ts

import { supabase } from "@lib/supabaseClient";

export type HeroSlide = {
  id: string;
  title: string | null;
  subtitle: string | null;
  button_label: string | null;
  button_url: string | null;
  image_url: string;
  image_mobile_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const TABLE = "hero_slides";

// Obtener TODOS los banners (admin)
export async function fetchAllSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetchAllSlides:", error);
    throw error;
  }

  return (data || []) as HeroSlide[];
}

// Obtener solo banners activos (página pública)
export async function fetchActiveSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetchActiveSlides:", error);
    throw error;
  }

  return (data || []) as HeroSlide[];
}

// Crear nuevo banner
export async function insertSlide(data: Partial<HeroSlide>) {
  const { error } = await supabase.from(TABLE).insert(data);

  if (error) {
    console.error("Error insertSlide:", error);
    throw error;
  }
}

// Actualizar banner
export async function updateSlide(id: string, data: Partial<HeroSlide>) {
  const { error } = await supabase.from(TABLE).update(data).eq("id", id);

  if (error) {
    console.error("Error updateSlide:", error);
    throw error;
  }
}

// Eliminar banner
export async function deleteSlide(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("Error deleteSlide:", error);
    throw error;
  }
}
