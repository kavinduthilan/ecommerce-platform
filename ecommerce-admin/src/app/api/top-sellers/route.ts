import { NextResponse } from "next/server";
import { getTopSellers } from "@/actions/top-sellers/top-sellers";

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 4);
  const data = await getTopSellers(limit);
  return NextResponse.json(data);
}