"use server";

import { OrderRow } from "@/lib/type";
import { prisma } from "@lib/prisma";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getOrders(): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customer: { select: { name: true, phone: true, address: true, email: true } },
      paymentStatus: true,
      status: true,
      totalAmount: true,
      notes: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          subtotal: true,
          productVariant: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });

  return orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    totalAmount: o.totalAmount.toNumber(),
    orderItems: o.orderItems.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      discount: i.discount.toNumber(),
      subtotal: i.subtotal.toNumber(),
    })),
  }));
}


export async function getOrder(orderId: number): Promise<OrderRow | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      customer: { select: { name: true, phone: true, address: true, email: true } },
      paymentStatus: true,
      status: true,
      totalAmount: true,
      notes: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          subtotal: true,
          productVariant: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });

  if (!order) return null;

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    totalAmount: order.totalAmount.toNumber(),
    orderItems: order.orderItems.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      discount: i.discount.toNumber(),
      subtotal: i.subtotal.toNumber(),
    })),
  };
}


type UpdateOrderStatusInput = {
  orderId: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

type UpdateOrderStatusResult =
  | { success: true; order: OrderRow }
  | { success: false; error: string };

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],      // too late to cancel
  DELIVERED: ["REFUNDED"],     // post-delivery return/refund
  CANCELLED: [],               // terminal
  REFUNDED: [],                // terminal
};

class OrderUpdateError extends Error { }

export async function updateOrderStatus({
  orderId,
  status,
  paymentStatus,
}: UpdateOrderStatusInput): Promise<UpdateOrderStatusResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized." };

  if (!Number.isInteger(orderId)) {
    return { success: false, error: "Invalid order id." };
  }
  if (status === undefined && paymentStatus === undefined) {
    return { success: false, error: "Nothing to update." };
  }
  if (status !== undefined && !Object.values(OrderStatus).includes(status)) {
    return { success: false, error: "Invalid order status." };
  }
  if (
    paymentStatus !== undefined &&
    !Object.values(PaymentStatus).includes(paymentStatus)
  ) {
    return { success: false, error: "Invalid payment status." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          status: true,
          paymentStatus: true,
          orderItems: { select: { productVariantId: true, quantity: true } },
        },
      });
      if (!current) throw new OrderUpdateError("Order not found.");

      // Cancelled orders are frozen, including payment status
      if (current.status === "CANCELLED") {
        throw new OrderUpdateError("This order is cancelled and can't be changed.");
      }

      const statusChanged = status !== undefined && status !== current.status;
      // Terminal orders (CANCELLED, REFUNDED) can't be changed at all
      if (ALLOWED_TRANSITIONS[current.status].length === 0) {
        throw new OrderUpdateError(
          `This order is ${current.status.toLowerCase()} and can't be changed.`
        );
      }

      const cancelling = statusChanged && status === "CANCELLED";
      const shipping = statusChanged && status === "SHIPPED";

      // Optimistic lock: only succeeds if nobody changed the status since we read it
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: current.status },
        data: {
          ...(statusChanged && { status }),
          ...(paymentStatus !== undefined && { paymentStatus }),
          // A paid order being cancelled needs a refund; mark it
          ...(cancelling &&
            paymentStatus === undefined &&
            current.paymentStatus === "PAID" && { paymentStatus: "REFUNDED" }),
        },
      });
      if (updated.count === 0) {
        throw new OrderUpdateError("Order was modified by someone else. Refresh and retry.");
      }

      if (cancelling || shipping) {
        for (const item of current.orderItems) {
          const inventory = await tx.inventory.findFirst({
            where: { productVariantId: item.productVariantId },
            select: { id: true },
          });
          if (!inventory) {
            throw new OrderUpdateError("Inventory record missing for an order item.");
          }

          const result = await tx.inventory.updateMany({
            where: {
              id: inventory.id,
              reversedQuantity: { gte: item.quantity },
            },
            data: cancelling
              ? {
                reversedQuantity: { decrement: item.quantity },
                availableQuantity: { increment: item.quantity },
              }
              : {
                reversedQuantity: { decrement: item.quantity },
                quantity: { decrement: item.quantity },
              },
          });
          if (result.count === 0) {
            throw new OrderUpdateError("Reserved stock doesn't match this order.");
          }

          if (cancelling) {
            await tx.stockMove.create({
              data: {
                inventoryId: inventory.id,
                type: "IN",
                quantity: item.quantity,
                reason: "Order cancelled (released)",
                referenceId: orderId,
                createdById: user.id,
              },
            });
          }
        }
      }
    });
  } catch (err) {
    if (err instanceof OrderUpdateError) {
      return { success: false, error: err.message };
    }
    console.error("Failed to update order:", err);
    return { success: false, error: "Failed to update order." };
  }

  const order = await getOrder(orderId);
  if (!order) return { success: false, error: "Order not found." };

  revalidatePath("/orders");
  revalidatePath("/inventory/stock-moves");
  return { success: true, order };
}