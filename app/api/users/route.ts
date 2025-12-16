import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPin, verifyPin } from "@/lib/auth";
import { z } from "zod";

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    const msg = String(error?.message || "");
    if (msg === "Unauthorized" || msg === "Forbidden: Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    // Accept both uppercase & lowercase to avoid breaking old data
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      role: z.enum(["ADMIN", "EMPLOYEE", "admin", "employee"]),
      pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
    });

    const data = schema.parse(body);

    // Normalize role to what your app expects (keep uppercase)
    const normalizedRole =
      data.role === "admin" ? "ADMIN" : data.role === "employee" ? "EMPLOYEE" : data.role;

    // Check if PIN is already in use (compare against hashes)
    const existingUsers = await prisma.user.findMany({
      select: { id: true, pinHash: true },
    });

    for (const u of existingUsers) {
      if (!u.pinHash) continue;
      const match = await verifyPin(data.pin, u.pinHash);
      if (match) {
        return NextResponse.json({ error: "PIN already in use" }, { status: 400 });
      }
    }

    const pinHash = await hashPin(data.pin);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        pinHash,
        role: normalizedRole,
      },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    const msg = String(error?.message || "");
    if (msg === "Unauthorized" || msg === "Forbidden: Admin access required") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Unique constraint violation" }, { status: 400 });
    }

    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}