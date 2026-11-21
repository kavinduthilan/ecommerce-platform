"use server";

import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Status } from "@/generated/prisma/enums";

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string(),
  categoryId: z.coerce.number().int().positive(),
  brandId: z.coerce.number().int().positive(),
  status: z.nativeEnum(Status).optional(),
});

// ---------- image helpers ----------
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function saveImage(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Only JPG, PNG or WEBP images are allowed");
  if (file.size > MAX_SIZE) throw new Error("Image must be under 2MB");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    Buffer.from(await file.arrayBuffer())
  );
  return `/uploads/products/${filename}`;
}

async function deleteImage(url?: string | null) {
  if (!url?.startsWith("/uploads/products/")) return;
  await unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
}

function parseForm(fd: FormData) {
  const input = createProductSchema.parse({
    name: fd.get("name"),
    description: fd.get("description"),
    categoryId: fd.get("categoryId"),
    brandId: fd.get("brandId"),
    status: fd.get("status") ?? undefined,
  });
  const image = fd.get("image");
  const file = image instanceof File && image.size > 0 ? image : null;
  return { input, file };
}

// ---------- actions ----------
export async function getProducts(page = 1, pageSize = 5) {
  const skip = (page - 1) * pageSize;

  const [data, totalCount] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true, // <-- added
        categoryId: true,
        brandId: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        status: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.product.count(),
  ]);

  return {
    data,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { input, file } = parseForm(formData);
  const imageUrl = file ? await saveImage(file) : null;

  try {
    const created = await prisma.product.create({
      data: {
        name: input.name,
        brandId: input.brandId,
        categoryId: input.categoryId,
        description: input.description,
        status: input.status,
        imageUrl,
        createdById: user.id,
      },
    });
    revalidatePath("/products");
    return created;
  } catch (err) {
    await deleteImage(imageUrl); // don't leave orphan files if the DB insert fails
    throw err;
  }
}

export async function updateProduct(id: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { input, file } = parseForm(formData);
  const removeImage = formData.get("removeImage") === "true";

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!existing) throw new Error("Product not found");

  let imageUrl: string | null | undefined = undefined; // undefined = keep as is
  if (file) imageUrl = await saveImage(file);
  else if (removeImage) imageUrl = null;

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: input.name,
      brandId: input.brandId,
      categoryId: input.categoryId,
      description: input.description,
      status: input.status,
      imageUrl,
    },
  });

  if (imageUrl !== undefined) await deleteImage(existing.imageUrl); // remove the old file

  revalidatePath("/products");
  return updated;
}

export async function getActiveProducts() {
  return prisma.product.findMany({
    where: { status: "Active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}