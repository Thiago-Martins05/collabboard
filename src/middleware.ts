export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/billing/:path*",
  ],
};
