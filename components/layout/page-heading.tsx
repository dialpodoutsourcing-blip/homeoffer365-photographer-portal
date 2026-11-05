export function PageHeading({ label, title, description }: { label: string; title: string; description: string }) {
  return <header className="page-heading"><span className="eyebrow">{label}</span><h1>{title}</h1><p>{description}</p></header>;
}
