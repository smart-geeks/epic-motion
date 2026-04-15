import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      nombre: string;
      avatar: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: string;
    nombre: string;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    rol: string;
    nombre: string;
    avatar: string | null;
  }
}
