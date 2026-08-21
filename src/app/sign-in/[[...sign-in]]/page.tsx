import { SignIn } from "@clerk/nextjs";

const clerkAppearance = {
  variables: {
    colorPrimary: "#e8452c",
    colorBackground: "#f4ecdc",
    colorText: "#1a1713",
    colorTextSecondary: "#5a4a35",
    colorInputBackground: "#ede4d0",
    colorInputText: "#1a1713",
    colorNeutral: "#1a1713",
    borderRadius: "2px",
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-inter), system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent border-0 p-0 gap-5",
    headerTitle: "font-bakbak text-[22px] tracking-[.01em] text-[#1a1713]",
    headerSubtitle: "text-[#5a4a35] text-[13px]",
    socialButtonsBlockButton:
      "border border-[#c8b99a] bg-[#ede4d0] hover:bg-[#e4d8c0] text-[#1a1713] font-medium rounded-sm",
    dividerLine: "bg-[#c8b99a]",
    dividerText: "text-[#5a4a35] text-[12px]",
    formFieldLabel: "text-[#3a2e1e] text-[12px] font-semibold",
    formFieldInput:
      "bg-[#ede4d0] border-[#c8b99a] text-[#1a1713] focus:border-[#e8452c] focus:ring-0 rounded-sm",
    formButtonPrimary:
      "bg-[#1a1713] hover:bg-[#e8452c] text-[#f4ecdc] font-semibold rounded-sm transition-colors font-inter",
    footerActionLink: "text-[#e8452c] hover:text-[#a82d19] font-medium",
    identityPreviewText: "text-[#1a1713]",
    identityPreviewEditButton: "text-[#e8452c]",
    formResendCodeLink: "text-[#e8452c]",
    otpCodeFieldInput: "border-[#c8b99a] bg-[#ede4d0] text-[#1a1713]",
    alertText: "text-[#1a1713]",
  },
};

export default function SignInPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left — brand panel */}
      <div
        className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "#1a1713" }}
      >
        {/* Hatch texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(38deg, #f4ecdc 0, #f4ecdc 1px, transparent 0, transparent 50%)",
            backgroundSize: "10px 10px",
          }}
        />

        {/* Top: wordmark */}
        <div className="relative z-10">
          <div className="font-bakbak text-[22px] tracking-[.02em] text-[#f4ecdc]">
            BOTTLEMOODI
          </div>
          <div className="font-anek text-[#e8452c] text-[14px] mt-1">
            Mood-க்கு ஏத்த Design
          </div>
        </div>

        {/* Center: bottle cap + Tamil */}
        <div className="relative z-10 flex flex-col items-start gap-6">
          {/* Bottle cap */}
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, #e8452c 0 4.2deg, #a82d19 4.2deg 8.4deg)",
            }}
          >
            <div
              className="w-[76%] h-[76%] rounded-full flex items-center justify-center text-center"
              style={{
                background: "#e8452c",
                boxShadow: "inset 0 0 0 2px rgba(244,236,220,.3)",
                fontFamily: "var(--font-anek)",
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1.15,
                color: "#f4ecdc",
              }}
            >
              பாட்டில்<br />மூடி
            </div>
          </div>

          <div>
            <div className="font-bakbak text-[48px] leading-[1.05] text-[#f4ecdc]">
              NORMAL<br />IS NOT<br />OUR SIZE
            </div>
            <div className="mt-4 font-anek text-[18px] text-[#c4b79c]">
              Tamil posters that actually say something.
            </div>
          </div>
        </div>

        {/* Bottom: tagline */}
        <div className="relative z-10 text-[11px] tracking-[.28em] text-[#5a4a35] uppercase">
          250gsm matte · printed in Chennai · shipped India &amp; worldwide
        </div>
      </div>

      {/* Right — sign-in form */}
      <div
        className="flex flex-col justify-center items-center p-8 md:p-16 min-h-screen md:min-h-0"
        style={{ background: "#f4ecdc" }}
      >
        {/* Mobile wordmark */}
        <div className="md:hidden text-center mb-8">
          <div className="font-bakbak text-[24px] tracking-[.02em] text-[#1a1713]">
            BOTTLEMOODI
          </div>
          <div className="font-anek text-[#e8452c] text-[13px] mt-1">
            Mood-க்கு ஏத்த Design
          </div>
        </div>

        <SignIn appearance={clerkAppearance} />
      </div>
    </div>
  );
}
