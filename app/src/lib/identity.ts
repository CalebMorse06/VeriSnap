import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE_NAME = "verisnap_uid";

export async function getOrSetUserId(): Promise<string> {
  const jar = await cookies();
  let uid = jar.get(COOKIE_NAME)?.value;
  if (!uid) {
    uid = randomUUID();
    jar.set(COOKIE_NAME, uid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return uid;
}
