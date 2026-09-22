import { supabase } from "@lib/supabaseClient";

export type CategoryOption = {
  label: string;
  value: string;
};

export type CategoryRow = {
  id: string;
  name: string;
};

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { label: "Souvenirs", value: "souvenirs" },
  { label: "Candy Bar y Deco", value: "candy-deco" },
  { label: "Productos Digitales", value: "productos-digitales" },
];

const LABEL_OVERRIDES: Record<string, string> = {
  souvenirs: "Souvenirs",
  "candy-deco": "Candy Bar y Deco",
  "productos-digitales": "Productos Digitales",
};

function toDisplayLabel(value: string) {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value];

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueCategoryOptions(categoryNames: string[]) {
  const seen = new Set<string>();

  return categoryNames
    .map((name) => name.trim())
    .filter(Boolean)
    .filter((name) => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((name) => ({
      label: toDisplayLabel(name),
      value: name,
    }));
}

export async function fetchCategoryOptions(): Promise<CategoryOption[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al cargar categorías:", error.message);
    return FALLBACK_CATEGORIES;
  }

  const categories = uniqueCategoryOptions(
    (data ?? []).map((category) => category.name ?? "")
  );

  return categories.length > 0 ? categories : FALLBACK_CATEGORIES;
}

export async function fetchAdminCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al cargar categorías:", error.message);
    throw error;
  }

  return (data ?? []) as CategoryRow[];
}

export async function countProductsByCategory(categoryName: string) {
  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", categoryName);

  if (error) {
    console.error("Error al contar productos por categoría:", error.message);
    throw error;
  }

  return count ?? 0;
}

export async function createCategory(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  const { error } = await supabase.from("categories").insert([{ name: cleanName }]);

  if (error) {
    console.error("Error al crear categoría:", error.message);
    throw error;
  }
}

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay sesión activa para realizar esta acción.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function requestAdminCategoryAction(
  method: "POST" | "PATCH" | "DELETE",
  payload: Record<string, unknown>
) {
  const response = await fetch("/api/admin/categories", {
    method,
    headers: await getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error || body?.detail || "No se pudo completar la acción.");
  }

  return body;
}

export async function createCategoryAsAdmin(name: string) {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  await requestAdminCategoryAction("POST", { name: cleanName });
}

export async function updateCategoryName(id: string, previousName: string, nextName: string) {
  const cleanName = nextName.trim();

  if (!cleanName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  if (cleanName === previousName) return;

  const { error: categoryError } = await supabase
    .from("categories")
    .update({ name: cleanName })
    .eq("id", id);

  if (categoryError) {
    console.error("Error al editar categoría:", categoryError.message);
    throw categoryError;
  }

  const { error: productsError } = await supabase
    .from("products")
    .update({ category: cleanName })
    .eq("category", previousName);

  if (productsError) {
    console.error("Error al actualizar productos de la categoría:", productsError.message);
    throw productsError;
  }
}

export async function updateCategoryNameAsAdmin(id: string, previousName: string, nextName: string) {
  const cleanName = nextName.trim();

  if (!cleanName) {
    throw new Error("El nombre de la categoría es obligatorio.");
  }

  if (cleanName === previousName) return;

  await requestAdminCategoryAction("PATCH", {
    id,
    previousName,
    name: cleanName,
  });
}

export async function deleteCategoryIfUnused(category: CategoryRow) {
  const productsCount = await countProductsByCategory(category.name);

  if (productsCount > 0) {
    throw new Error(
      `No se puede eliminar "${category.name}" porque hay ${productsCount} producto${
        productsCount === 1 ? "" : "s"
      } usando esta categoría.`
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", category.id)
    .select("id");

  if (error) {
    console.error("Error al eliminar categoría:", error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(
      "Supabase no eliminó la categoría. Revisá las políticas RLS/permisos de DELETE para la tabla categories."
    );
  }
}

export async function deleteCategoryAsAdmin(category: CategoryRow) {
  await requestAdminCategoryAction("DELETE", {
    id: category.id,
    name: category.name,
  });
}