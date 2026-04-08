import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const { GET: _GET, POST: _POST } = toNextJsHandler(auth);


export async function GET(request: Request) {
  return _GET(request);
}

export async function POST(request: Request) {
  return _POST(request);
}
