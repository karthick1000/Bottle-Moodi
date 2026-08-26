import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartSidebar } from "@/components/CartSidebar";
import { AuthModal } from "@/components/AuthModal";
import { IntroLoader } from "@/components/IntroLoader";
import { ScrollBottle } from "@/components/ScrollBottle";
import { CartSync } from "@/components/CartSync";
import { ConfigSync } from "@/components/ConfigSync";
import { getShippingRule } from "@/lib/db/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // One cached read per render for the whole storefront, instead of a client
  // fetch in each surface that displays a delivery line.
  const shipping = await getShippingRule();

  return (
    <>
      <IntroLoader />
      <ScrollBottle />
      <div className="min-h-screen flex flex-col">
        <Header />
        {children}
        <Footer />
      </div>
      <CartSidebar />
      <AuthModal />
      <CartSync />
      <ConfigSync shipping={shipping} />
    </>
  );
}
