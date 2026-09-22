import { NextResponse } from "next/server";
import { requireAdmin } from "@lib/adminAuth";
import { getSupabaseAdmin } from "@lib/supabaseAdmin";

async function countProductsByCategoryName(categoryName: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { count, error } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category", categoryName);

  if (error) throw error;

  return count ?? 0;
}

async function ensureAdmin(req: Request) {
  const adminCheck = await requireAdmin(req);

  if (!adminCheck.ok) {
    const status = adminCheck.reason === "forbidden" ? 403 : 401;
    return NextResponse.json({ error: adminCheck.reason }, { status });
  }

  return null;
}

export async function POST(req: Request) {
  const authError = await ensureAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "El nombre de la categoría es obligatorio." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .insert([{ name }])
      .select("id, name")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, category: data });
  } catch (error: any) {
    console.error("admin.categories POST error:", error);
    return NextResponse.json(
      { error: "Error creando categoría", detail: error?.message || null },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const authError = await ensureAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const previousName = String(body?.previousName || "").trim();
    const name = String(body?.name || "").trim();

    if (!id || !previousName || !name) {
      return NextResponse.json(
        { error: "id, previousName y name son obligatorios." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: duplicated, error: duplicatedError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .ilike("name", name)
      .neq("id", id)
      .maybeSingle();

    if (duplicatedError) {
      return NextResponse.json({ error: duplicatedError.message }, { status: 500 });
    }

    if (duplicated) {
      return NextResponse.json({ error: "Ya existe otra categoría con ese nombre." }, { status: 409 });
    }

    const { data: category, error: categoryError } = await supabaseAdmin
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select("id, name")
      .maybeSingle();

    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    }

    const { error: productsError } = await supabaseAdmin
      .from("products")
      .update({ category: name })
      .eq("category", previousName);

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, category });
  } catch (error: any) {
    console.error("admin.categories PATCH error:", error);
    return NextResponse.json(
      { error: "Error editando categoría", detail: error?.message || null },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const authError = await ensureAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const name = String(body?.name || "").trim();

    if (!id || !name) {
      return NextResponse.json({ error: "id y name son obligatorios." }, { status: 400 });
    }

    const productsCount = await countProductsByCategoryName(name);

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar "${name}" porque hay ${productsCount} producto${
            productsCount === 1 ? "" : "s"
          } usando esta categoría.`,
        },
        { status: 409 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Categoría no encontrada o no eliminada." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("admin.categories DELETE error:", error);
    return NextResponse.json(
      { error: "Error eliminando categoría", detail: error?.message || null },
      { status: 500 }
    );
  }
}