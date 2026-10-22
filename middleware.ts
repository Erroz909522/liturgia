import { NextResponse, type NextRequest } from "next/server";

// Protege o app inteiro com uma senha simples quando APP_SENHA está definida
export function middleware(req: NextRequest) {
  const senha = process.env.APP_SENHA;
  if (!senha) return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [, informada] = atob(auth.slice(6)).split(/:(.*)/s);
    if (informada === senha) return NextResponse.next();
  }
  return new NextResponse("Senha necessária", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Liturgia", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
