import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import type { RegisterInput, LoginInput } from "./auth.schemas";

const SALT_ROUNDS = 12;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("Email already in use");
  }

  const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      lat: input.lat,
      lng: input.lng,
      barrioId: input.barrioId,
      fcmToken: input.fcmToken,
    },
    select: {
      id: true,
      name: true,
      email: true,
      lat: true,
      lng: true,
      barrioId: true,
      createdAt: true,
    },
  });

  const token = await signToken({ sub: String(user.id), email: user.email });

  return { user, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await bcrypt.compare(input.password, user.password);

  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = await signToken({ sub: String(user.id), email: user.email });

  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      lat: true,
      lng: true,
      barrioId: true,
      fcmToken: true,
      createdAt: true,
      barrio: { select: { id: true, name: true } },
    },
  });

  return user;
}
