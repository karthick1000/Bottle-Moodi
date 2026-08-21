import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/checkout");
  return <>{children}</>;
}
