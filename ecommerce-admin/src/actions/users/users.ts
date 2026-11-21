"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";





export async function getUsers(){
     return prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          select: {
               id: true,
               name: true,
               email: true,
               password: true,
               status: true,
               createdAt: true,
          },
  });
}



export async function createUser(name: string, email: string, password: string) {

     const data = { name, email, password };

     const user =  await getCurrentUser();

     if (!user) throw new Error("Unauthorized");

     const created = await prisma.user.create({
          data: {
               ...data,
               // createdById: user.id
          }
     }) 

     

     return created;
}


export async function updateUser(id:number, name: string, email: string, password: string) {
     
     const data = { name, email, password };

     const updated = await prisma.user.update({
          where: { id },
          data,                    
     });

     

     revalidatePath("/system-users");

     return updated;
}