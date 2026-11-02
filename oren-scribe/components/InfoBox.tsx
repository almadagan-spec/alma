export function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border border-line bg-box px-5 py-3">
      <h2 className="font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm">אין נתונים</p>
      ) : (
        <ul className="text-sm" dir="auto">
          {items.map((it) => (
            <li key={it}>{it}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
