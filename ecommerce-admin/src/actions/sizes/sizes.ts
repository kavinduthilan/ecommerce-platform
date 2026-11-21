"use server";

import { Status } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSizes(page: number = 1, pageSize: number = 5) {
  const skip = (page - 1) * pageSize;

  const [data, totalCount] = await Promise.all([
    prisma.size.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        createdBy: { select: { name: true } },
      },
    }),
    prisma.size.count(),
  ]);

  return {
    data,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function createSize(name: string, status: Status) {
  const data = { name, status };
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const created = await prisma.size.create({
    data: { ...data, createdById: user.id },
  });

  revalidatePath("/sizes");
  return created;
}

export async function updateSize(id: number, name: string, status: Status) {
  const data = { name, status };
  const updated = await prisma.size.update({ where: { id }, data });

  revalidatePath("/sizes");
  return updated;
}

export async function getActiveSizes() {
  return prisma.size.findMany({
    where: { status: "Active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}