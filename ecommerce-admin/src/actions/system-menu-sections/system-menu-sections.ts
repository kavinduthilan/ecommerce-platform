"use server";

import { prisma } from "@lib/prisma";

export async function getSystemMenuSections(){
     return prisma.systemMenuSection.findMany({
          orderBy: { createdAt: "asc" },
          select: {
               id: true,
               name: true,
               status: true,
               createdAt: true
          },
  });
}


