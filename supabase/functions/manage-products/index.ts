import { cors, errorResponse, json, serviceClient } from "../_shared/http.ts";
import { InputError, MAX_BYTES } from "../_shared/validation.ts";
import { normalizeReceipt } from "../_shared/receipt.ts";

type Product = {
  id: string;
  name: string;
  brand: "snackyzz" | "baking-stereo";
  price: number;
  description: string;
  tag: string;
  image: string;
  accent: string;
  position: number;
  active: boolean;
};

function text(form: FormData, key: string, max: number, min = 1) {
  const value = String(form.get(key) ?? "").trim();
  if (value.length < min || value.length > max || /[\x00-\x1f]/.test(value)) {
    throw new InputError(`Revisa el campo ${key}.`);
  }
  return value;
}
function integer(form: FormData, key: string, min: number, max: number) {
  const raw = String(form.get(key) ?? "");
  if (!/^\d+$/.test(raw)) throw new InputError(`Revisa el campo ${key}.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new InputError(`Revisa el campo ${key}.`);
  }
  return value;
}
function publicPath(url: string) {
  const marker = "/storage/v1/object/public/product-images/";
  const index = url.indexOf(marker);
  return index === -1
    ? ""
    : decodeURIComponent(url.slice(index + marker.length));
}
async function authorize(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (.+)$/i)
    ?.[1];
  if (!token) {
    throw new InputError("Inicia sesión para gestionar productos.", 401);
  }
  const db = serviceClient();
  const { data: userData, error: authError } = await db.auth.getUser(token);
  if (authError || !userData.user) {
    throw new InputError("La sesión venció. Vuelve a iniciar sesión.", 401);
  }
  const { data: admin, error: adminError } = await db.from("admin_users")
    .select("user_id").eq("user_id", userData.user.id).maybeSingle();
  if (adminError) {
    throw new InputError("No se pudieron verificar tus permisos.", 503);
  }
  if (!admin) {
    throw new InputError("Esta cuenta no tiene acceso de administración.", 403);
  }
  return db;
}

Deno.serve(async (request: Request) => {
  let headers: Record<string, string> = {};
  try {
    headers = cors(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (!["GET", "POST"].includes(request.method)) {
      throw new InputError("Método no permitido.", 405);
    }
    const db = await authorize(request);
    if (request.method === "GET") {
      const { data, error } = await db.from("products").select("*").order(
        "position",
      ).order("name");
      if (error) {
        throw new InputError("No se pudieron cargar los productos.", 503);
      }
      return json({ products: data }, 200, headers);
    }
    const contentType = request.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (
        !body || !["archive", "restore"].includes(body.action) ||
        !/^[a-z0-9-]{1,80}$/.test(body.productId ?? "")
      ) {
        throw new InputError("Acción de producto inválida.");
      }
      const { data, error } = await db.from("products").update({
        active: body.action === "restore",
      }).eq("id", body.productId).select().single();
      if (error) {
        throw new InputError(
          "No se pudo actualizar el producto.",
          error.code === "PGRST116" ? 404 : 503,
        );
      }
      return json({ product: data }, 200, headers);
    }
    if (Number(request.headers.get("Content-Length")) > MAX_BYTES + 20_000) {
      throw new InputError("La imagen supera 5 MB.", 413);
    }
    const form = await request.formData();
    const id = String(form.get("id") ?? "").trim();
    if (id && !/^[a-z0-9-]{1,80}$/.test(id)) {
      throw new InputError("Producto inválido.");
    }
    const name = text(form, "name", 80, 2);
    const brand = String(form.get("brand") ?? "snackyzz");
    if (!["snackyzz", "baking-stereo"].includes(brand)) {
      throw new InputError("Selecciona una sección del catálogo válida.");
    }
    const values = {
      brand,
      name,
      price: integer(form, "price", 1, 1_000_000),
      position: integer(form, "position", 0, 999),
      tag: text(form, "tag", 40),
      description: text(form, "description", 500, 4),
      accent: text(form, "accent", 7, 7),
    };
    if (!/^#[0-9a-f]{6}$/i.test(values.accent)) {
      throw new InputError("Selecciona un color válido.");
    }
    let existingImage = "";
    if (id) {
      const { data: existing, error } = await db.from("products").select(
        "image",
      )
        .eq("id", id).single();
      if (error || !existing) {
        throw new InputError("Producto no encontrado.", 404);
      }
      existingImage = existing.image;
    }
    const file = form.get("image");
    let image = existingImage;
    let uploadedPath = "";
    if (file instanceof File && file.size) {
      if (
        file.size > MAX_BYTES ||
        !["image/jpeg", "image/png"].includes(file.type)
      ) {
        throw new InputError("Usa una imagen JPG o PNG de hasta 5 MB.");
      }
      const normalized = await normalizeReceipt(
        new Uint8Array(await file.arrayBuffer()),
      );
      uploadedPath = `${crypto.randomUUID()}.jpg`;
      const { error } = await db.storage.from("product-images").upload(
        uploadedPath,
        normalized,
        { contentType: "image/jpeg", upsert: false },
      );
      if (error) throw new InputError("No se pudo guardar la imagen.", 503);
      image = db.storage.from("product-images").getPublicUrl(uploadedPath).data
        .publicUrl;
    }
    if (!image) throw new InputError("Selecciona una imagen del producto.");
    let result;
    if (id) {
      result = await db.from("products").update({ ...values, image }).eq(
        "id",
        id,
      ).select().single();
    } else {
      const slug =
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) ||
        "producto";
      result = await db.from("products").insert({
        ...values,
        id: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
        image,
        active: true,
      }).select().single();
    }
    if (result.error) {
      if (uploadedPath) {
        await db.storage.from("product-images").remove([uploadedPath]);
      }
      throw new InputError("No se pudo guardar el producto.", 503);
    }
    const oldPath = id && uploadedPath ? publicPath(existingImage) : "";
    if (oldPath) await db.storage.from("product-images").remove([oldPath]);
    return json({ product: result.data as Product }, id ? 200 : 201, headers);
  } catch (error) {
    return errorResponse(error, headers);
  }
});
