"use server";

import { prisma } from "@lib/prisma";
import { UserSectionPermission } from "@/lib/type";

export async function createUserSectionPermissions(
  userId: number,
  data: UserSectionPermission[]
) {
  const [, created] = await prisma.$transaction([
    prisma.systemMenuSectionPermission.deleteMany({ where: { userId } }),
    prisma.systemMenuSectionPermission.createMany({
      data: data.map((p) => ({
        userId, 
        sectionId: p.sectionId,
        isEnabled: p.isEnabled,
      })),
    }),
  ]);

  return created;
}


export async function getUserSectionPermissions(userId: number) {
  const permissions = await prisma.systemMenuSectionPermission.findMany({
    where: { userId },
  });

  return permissions;
}