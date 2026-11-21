"use server";

import { Status } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_URL = "/uploads/categories";

async function saveImage(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Only JPG, PNG or WEBP images are allowed");
  if (file.size > MAX_SIZE) throw new Error("Image must be under 2MB");

  const dir = path.join(process.cwd(), "public", "uploads", "categories");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return `${UPLOAD_URL}/${filename}`;
}

async function deleteImage(url?: string | null) {
  if (!url || !url.startsWith(`${UPLOAD_URL}/`)) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    /* file already gone */
  }
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });
}

export async function createCategory(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  const status = formData.get("status") as Status;
  const image = formData.get("image") as File | null;

  if (!name) throw new Error("Please enter a category");

  let imageUrl: string | null = null;
  if (image && image.size > 0) imageUrl = await saveImage(image);

  const created = await prisma.category.create({
    data: { name, status, imageUrl, createdById: user.id },
  });

  revalidatePath("/categories");
  return created;
}

export async function updateCategory(id: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const status = formData.get("status") as Status;
  const image = formData.get("image") as File | null;
  const removeImage = formData.get("removeImage") === "true";

  if (!name) throw new Error("Please enter a category");

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { imageUrl: true },
  });

  let imageUrl = existing?.imageUrl ?? null;

  if (image && image.size > 0) {
    imageUrl = await saveImage(image);
    await deleteImage(existing?.imageUrl); // replace old file
  } else if (removeImage) {
    await deleteImage(existing?.imageUrl);
    imageUrl = null;
  }

  const updated = await prisma.category.update({
    where: { id },
    data: { name, status, imageUrl },
  });

  revalidatePath("/categories");
  return updated;
}

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { status: "Active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, imageUrl: true },
  });
}