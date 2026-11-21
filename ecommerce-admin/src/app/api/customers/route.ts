import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function POST(req: Request) {

     try {
          const { customer } = await req.json();

          if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city) {
               return NextResponse.json(
                    { message: "Missing required fields." },
                    { status: 400 }
               );
          }

          const phone = customer.phone;
          const email = customer.email;

          const existing = await prisma.customer.findFirst({
               where: {
                    OR: [{ phone }, ...(email ? [{ email }] : [])],
               },
               select: { id: true },
          });

          if (existing) {
               return NextResponse.json(
                    { success: true, id: existing.id, existing: true },
                    { status: 200 }
               );
          }

          const created = await prisma.customer.create({
               data: {
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email,
                    address: customer.address,
               },
               select: { id: true }
          });

          return NextResponse.json({ success: true, id: created.id }, { status: 201 });
     } catch (error) {
          console.error("error:", error);
          return NextResponse.json(
               { message: "Failed to create customer." },
               { status: 500 }
          );
     }
}