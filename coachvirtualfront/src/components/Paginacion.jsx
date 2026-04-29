import React from "react";

export default function Paginacion({
  currentPage,
  totalItems,
  pageSize = 5,
  onPageChange,
}) {
  const total = totalItems ?? 0;
  const page = currentPage ?? 1;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Si no hay elementos o solo hay una página, no mostramos nada
  if (!total || totalPages <= 1) return null;

  const maxButtons = 5; // cantidad de botones numéricos visibles

  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange?.(p);
  };

  const firstIdx = (page - 1) * pageSize + 1;
  const lastIdx = Math.min(page * pageSize, total);

  const btnBase =
    "px-3 py-1 rounded-full text-sm transition border border-white/20";
  const btnGhost = `${btnBase} bg-white/10 text-white hover:bg-white/20`;
  const btnActive = `${btnBase} bg-white text-gray-900 font-semibold`;

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex items-center justify-center gap-2"
    >
      <button className={btnGhost} onClick={() => go(1)} disabled={page === 1}>
        Primera
      </button>

      <button
        className={btnGhost}
        onClick={() => go(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </button>

      {start > 1 && <span className="px-1 text-white/60">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? btnActive : btnGhost}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && <span className="px-1 text-white/60">…</span>}

      <button
        className={btnGhost}
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
      >
        Siguiente
      </button>

      <button
        className={btnGhost}
        onClick={() => go(totalPages)}
        disabled={page === totalPages}
      >
        Última
      </button>

      <span className="ml-3 text-white/60 text-sm">
        {firstIdx}–{lastIdx} de {total}
      </span>
    </nav>
  );
}
