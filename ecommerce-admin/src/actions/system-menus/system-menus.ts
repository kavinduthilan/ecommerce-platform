"use server";

import { prisma } from "@lib/prisma";

export async function getSystemMenus(){
     return prisma.systemMenu.findMany({
          orderBy: { createdAt: "desc" },
          select: {
               id: true,
               name: true,
               path: true,
               status: true,
               sectionId: true,
               createdAt: true
          },
  });
}