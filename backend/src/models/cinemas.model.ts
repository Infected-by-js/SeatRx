import {DB} from "@/config/db"
import {Cinema} from "@/types/entities"

const db = new DB("cinemas")

export async function getAllCinemas(): Promise<Cinema[]> {
  return await db.findAll<Cinema>()
}

export async function getCinemaById(id: number): Promise<Cinema | null> {
  return await db.findById<Cinema>(id)
}

export async function createCinema(data: {name: string; color: string}): Promise<Cinema> {
  return await db.create<typeof data, Cinema>(data)
}

export async function updateCinema(id: number, data: {name?: string; color?: string}): Promise<Cinema> {
  return await db.update<typeof data, Cinema>(id, data)
}

export async function deleteCinema(id: number): Promise<void> {
  await db.delete(id)
}
