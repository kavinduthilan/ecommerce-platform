"use server";

import { prisma } from "@lib/prisma";
import { UserMenuPermission } from "@/lib/type";

export async function createUserMenuPermissions(
  userId: number,
  data: UserMenuPermission[]
) {
  const [, created] = await prisma.$transaction([
    prisma.systemMenuPermission.deleteMany({ where: { userId } }),
    prisma.systemMenuPermission.createMany({
      data: data.map((p) => ({
        userId,
        menuId: p.menuId,
        canView: p.canView,
        canAdd: p.canAdd,
        canEdit: p.canEdit,
      })),
    }),
  ]);

  return created;
}


export async function getUserMenuPermissions(
  userId: number
): Promise<UserMenuPermission[]> {
  const permissions = await prisma.systemMenuPermission.findMany({
    where: { userId },
  });

  return permissions;
}