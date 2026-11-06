import Image from "next/image";

export function BrandLogo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className={`brand-lockup brand-lockup--${tone}`}>
      <Image
        className="brand-logo-image"
        src="/images/brand/home-offer-365-logo.png"
        alt="Home Offer 365"
        width={768}
        height={296}
        priority
      />
    </span>
  );
}
