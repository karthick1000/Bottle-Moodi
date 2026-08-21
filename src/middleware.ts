import { clerkMiddleware } from "@clerk/nextjs/server";

export const runtime = "nodejs";

// Auth protection is handled inside each protected page/route via auth()
// so the middleware only needs to attach Clerk's auth context to the request.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
