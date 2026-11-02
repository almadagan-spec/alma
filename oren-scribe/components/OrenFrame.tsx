// The EMR window chrome from the wireframes: top bar "Oren Health",
// a second bar (patient name / tabs), then the content.

export function OrenFrame({
  subBar,
  children,
}: {
  subBar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col p-4 sm:p-8">
      <div className="flex flex-1 flex-col border border-line bg-white">
        <header className="border-b border-line bg-bar-top px-3 py-2 font-bold" dir="ltr">
          Oren Health
        </header>
        <div className="flex min-h-10 items-stretch justify-between gap-2 bg-bar-sub px-3">
          {subBar}
        </div>
        {children}
      </div>
    </div>
  );
}

export const outlineButton =
  "border border-ink/70 bg-bar-top/60 px-2 py-0.5 text-sm font-medium hover:bg-bar-top";
