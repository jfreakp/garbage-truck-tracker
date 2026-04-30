import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ConflictError } from "@/lib/errors";
import type { CreateDeviceInput, UpdateDeviceInput } from "./devices.schemas";

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex
}

const SELECT = {
  id:        true,
  name:      true,
  token:     true,
  active:    true,
  createdAt: true,
  truck:     { select: { id: true, name: true } },
} as const;

export async function listDevices() {
  return prisma.device.findMany({ select: SELECT, orderBy: { createdAt: "desc" } });
}

export async function getDevice(id: number) {
  const device = await prisma.device.findUnique({ where: { id }, select: SELECT });
  if (!device) throw new NotFoundError("Device");
  return device;
}

export async function createDevice(input: CreateDeviceInput) {
  const conflict = await prisma.device.findUnique({ where: { truckId: input.truckId } });
  if (conflict) throw new ConflictError("Este camión ya tiene un equipo asignado");

  return prisma.device.create({
    data: { name: input.name, truckId: input.truckId, token: generateToken() },
    select: SELECT,
  });
}

export async function updateDevice(id: number, input: UpdateDeviceInput) {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new NotFoundError("Device");

  if (input.truckId && input.truckId !== device.truckId) {
    const conflict = await prisma.device.findUnique({ where: { truckId: input.truckId } });
    if (conflict) throw new ConflictError("Este camión ya tiene un equipo asignado");
  }

  return prisma.device.update({ where: { id }, data: input, select: SELECT });
}

export async function regenerateToken(id: number) {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new NotFoundError("Device");
  return prisma.device.update({
    where:  { id },
    data:   { token: generateToken() },
    select: SELECT,
  });
}

export async function deleteDevice(id: number) {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new NotFoundError("Device");
  await prisma.device.delete({ where: { id } });
}

/** Usado por el endpoint de ubicación para autenticar tokens de dispositivo */
export async function findActiveDeviceByToken(token: string) {
  return prisma.device.findFirst({
    where:  { token, active: true },
    select: { truckId: true },
  });
}
