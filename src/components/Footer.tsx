import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-dark text-[#8d8371] px-4 md:px-7 pt-12 md:pt-[60px] pb-8 md:pb-[38px] border-t-[3px] border-double border-[#e8452c] mt-auto">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-11">
        <div>
          <div className="font-bakbak text-[21px] text-cream">BOTTLEMOODI</div>
          <div className="font-anek text-[15px] text-[#e8452c] mt-2">Mood-க்கு ஏத்த Design</div>
          <div className="font-mono text-[11px] text-[#544b3e] mt-3 tracking-[.08em]">
            Posters · Chennai
          </div>
        </div>
        <div className="grid gap-[9px] text-[13.5px]">
          <Link href="/shop" className="text-[#8d8371] hover:text-cream">Shop</Link>
          <Link href="/#story" className="text-[#8d8371] hover:text-cream">Story</Link>
          <Link href="/#soon" className="text-[#8d8371] hover:text-cream">Coming soon</Link>
        </div>
        <div className="grid gap-[9px] text-[13.5px]">
          <a href="#" className="text-[#8d8371] hover:text-cream">Instagram</a>
          <a href="#" className="text-[#8d8371] hover:text-cream">Shipping &amp; returns</a>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto mt-8 md:mt-10 font-mono text-[10.5px] tracking-[.1em] text-[#544b3e]">
        © 2026 BOTTLEMOODI · CHENNAI
      </div>
    </footer>
  );
}
