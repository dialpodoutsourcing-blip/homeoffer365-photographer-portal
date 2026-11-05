import Image from "next/image";

export function BrandLogo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span className={`brand-lockup brand-lockup--${tone}`} role="img" aria-label="Home Offer 365 photographer guide">
      <Image className="brand-mark" src="/images/brand/guide-mark.svg" alt="" width={52} height={52} />
      <span className="brand-wordmark">
        <span className="brand-kicker">HOME</span>
        <span className="brand-name">OFFER <span className="brand-number">365</span></span>
      </span>
    </span>
  );
}
