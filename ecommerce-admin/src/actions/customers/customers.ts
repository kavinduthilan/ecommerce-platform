"use server";

import { prisma } from "@lib/prisma";
import { revalidatePath } from "next/cache";
import {  Customer, CustomerOrderHistory } from "@/lib/type";
import {  z } from "zod";
import { Status } from "@/generated/prisma/enums";
import { getUser } from "@/actions/auth/getUser";

const createCustomerSchema = z.object({
     name: z.string(),
     email: z.string(),
     phone: z.number(),
     address: z.string(),
     status: z.nativeEnum(Status),
});



export async function getCustomers(page: number, pageSize: number) {
  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count(),
  ]);

  const data = rows.map((row) => ({
    ...row
  }));

  return {
    data,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateCustomer(id: number, data: Customer) {

  const input = createCustomerSchema.parse(data);
  
  await prisma.customer.update({ where: { id }, data: {
     name: input.name,
     email: input.email,
     phone: input.phone,
     address: input.address,
     status: input.status
  } });

  revalidatePath("/customers");
  return {success:true};
}


export async function getActiveCustomers(){
     return prisma.customer.findMany({
          where:  {status: "Active"},
          orderBy: { createdAt: "desc" },
          select: {
               id: true,
               name: true,
          },
  });
}


export async function getCustomerOrders(
  customerId: number
): Promise<CustomerOrderHistory | null> {
  // Server actions are public endpoints, so check auth here too
  const currentUser = await getUser();
  if (!currentUser) throw new Error("Unauthorized");

  if (!Number.isInteger(customerId)) return null;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      status: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          notes: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              productVariant: { select: { name: true, sku: true } },
            },
          },
        },
      },
    },
  });

  if (!customer) return null;

  const orders = customer.orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    totalAmount: o.totalAmount.toNumber(),
    orderItems: o.orderItems.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      subtotal: i.subtotal.toNumber(),
    })),
  }));

  // Cancelled / refunded orders don't count toward spend
  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const { orders: _ignored, ...customerInfo } = customer;

  return {
    customer: { ...customerInfo, createdAt: customer.createdAt.toISOString() },
    orders,
    summary: { totalOrders: orders.length, totalSpent },
  };
}

