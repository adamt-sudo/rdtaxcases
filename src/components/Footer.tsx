export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-600">
        <p className="max-w-2xl">
          RDTAXCASES.com is the most extensive database of international R&D
          tax credit cases on the internet, a Swanson Reed database.
        </p>
        <p className="mt-4 text-xs text-slate-600">
          &copy; {new Date().getFullYear()} RDTAXCASES.com. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
