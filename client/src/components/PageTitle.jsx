export function PageTitle({ eyebrow, title, text }) {
  return <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary"></p><h1 className="font-display text-4xl font-semibold sm:text-5xl">{title}</h1><p className="mt-2 text-muted-foreground">{text}</p></div>;
}
