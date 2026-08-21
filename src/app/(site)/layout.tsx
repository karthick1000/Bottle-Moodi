import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartSidebar } from "@/components/CartSidebar";
import { AuthModal } from "@/components/AuthModal";
import { IntroLoader } from "@/components/IntroLoader";
import { ScrollBottle } from "@/components/ScrollBottle";
import { CartSync } from "@/components/CartSync";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
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
    </>
  );
}
