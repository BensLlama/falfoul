"use client";

import { useRef, useState } from "react";
import { PixelIcon, PixelIconName } from "@/components/PixelIcon";
import { MacAlert } from "@/components/MacDialog";

/** Known category emojis rendered as Susan-Kare-style pixel icons. */
const EMOJI_ICON: Record<string, PixelIconName> = {
  "🧴": "bottle",
  "🍫": "chocolate",
  "☕": "cup",
  "☕️": "cup",
  "🧻": "roll",
  "🥤": "drink",
  "🥫": "can",
  "🥛": "milk",
  "🍽": "plate",
  "🍽️": "plate",
  "🧹": "broom",
  "🌶": "pepper",
  "🌶️": "pepper",
  "🍞": "chocolate",
  "🥖": "chocolate",
};

export type Cat = {
  id: number;
  name: string;
  parentId: number | null;
  productCount: number;
};

type Action = (formData: FormData) => void;
type Actions = { create: Action; update: Action; remove: Action };

/* ------------------------------ helpers -------------------------------- */

const childrenOf = (all: Cat[], id: number) =>
  all.filter((c) => c.parentId === id);

function descendantCount(all: Cat[], id: number): number {
  const kids = childrenOf(all, id);
  return kids.reduce((s, k) => s + 1 + descendantCount(all, k.id), 0);
}

/** Split a leading emoji off a category name, e.g. "🥛 Dairy". */
function splitEmoji(name: string): { icon: string | null; label: string } {
  const m = name.match(/^(\p{Extended_Pictographic}️?)\s*(.+)$/u);
  return m ? { icon: m[1], label: m[2] } : { icon: null, label: name };
}

function deleteMessage(all: Cat[], cat: Cat): string {
  const subs = descendantCount(all, cat.id);
  return (
    `Delete category "${cat.name}"?` +
    (subs > 0 ? ` Its ${subs} sub-categories will move up one level.` : "") +
    (cat.productCount > 0
      ? ` Its ${cat.productCount} products will become uncategorized (not deleted).`
      : "")
  );
}

/* --------------------------- small controls ---------------------------- */

function IconButton({
  title,
  onClick,
  children,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-md p-1 text-gray-300 transition hover:bg-gray-100 ${
        danger ? "hover:text-red-500" : "hover:text-emerald-600"
      }`}
    >
      {children}
    </button>
  );
}

function IconDelete({
  cat,
  all,
  remove,
}: {
  cat: Cat;
  all: Cat[];
  remove: Action;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <form
        action={remove}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex"
      >
        <input type="hidden" name="id" value={cat.id} />
        <button
          type="button"
          title="Delete"
          aria-label="Delete"
          onClick={() => setOpen(true)}
          className="rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
        >
          <PixelIcon name="cross" size={11} />
        </button>
      </form>
      {open && (
        <MacAlert
          message={deleteMessage(all, cat)}
          confirmLabel="Delete"
          danger
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            ref.current?.requestSubmit();
          }}
        />
      )}
    </>
  );
}

/** Inline rename form (keeps the current parent). */
function RenameForm({
  cat,
  update,
  done,
}: {
  cat: Cat;
  update: Action;
  done: () => void;
}) {
  return (
    <form
      action={update}
      onSubmit={done}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center gap-1"
    >
      <input type="hidden" name="id" value={cat.id} />
      <input type="hidden" name="parentId" value={cat.parentId ?? ""} />
      <input
        name="name"
        defaultValue={cat.name}
        autoFocus
        required
        className="!h-8 !w-40 !px-2 !text-xs"
      />
      <button className="btn btn-primary !px-2 !py-1 !text-xs">Save</button>
      <button
        type="button"
        onClick={done}
        className="btn btn-ghost !px-2 !py-1 !text-xs"
      >
        Cancel
      </button>
    </form>
  );
}

/** A "+ Add" button that turns into a small inline create form. */
function AddInline({
  parentId,
  create,
  label,
  placeholder,
  startOpen,
  onDone,
}: {
  parentId: number | null;
  create: Action;
  label: string;
  placeholder?: string;
  startOpen?: boolean;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(startOpen ?? false);
  const close = () => {
    setOpen(false);
    onDone?.();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400 transition hover:border-emerald-400 hover:text-emerald-600"
      >
        <PixelIcon name="plus" size={10} /> {label}
      </button>
    );
  }

  return (
    <form
      action={create}
      onSubmit={close}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-wrap items-center gap-1"
    >
      {parentId !== null && (
        <input type="hidden" name="parentId" value={parentId} />
      )}
      <input
        name="name"
        autoFocus
        required
        placeholder={placeholder ?? "Name…"}
        className="!h-8 !w-40 !px-2 !text-xs"
      />
      <button className="btn btn-primary !px-2 !py-1 !text-xs">Add</button>
      <button
        type="button"
        onClick={close}
        className="btn btn-ghost !px-2 !py-1 !text-xs"
      >
        Cancel
      </button>
    </form>
  );
}

/* ------------------------------- pieces -------------------------------- */

/** Leaf category as a small chip with add / rename / delete. */
function Chip({ cat, all, actions }: { cat: Cat; all: Cat[]; actions: Actions }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  if (editing) {
    return <RenameForm cat={cat} update={actions.update} done={() => setEditing(false)} />;
  }

  return (
    <>
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 py-0.5 pl-3 pr-1 text-xs text-gray-700">
        <span className="max-w-40 truncate">{cat.name}</span>
        <IconButton title="Add sub-category inside" onClick={() => setAdding(true)}>
          <PixelIcon name="plus" size={11} />
        </IconButton>
        <IconButton title="Rename" onClick={() => setEditing(true)}>
          <PixelIcon name="pencil" size={11} />
        </IconButton>
        <IconDelete cat={cat} all={all} remove={actions.remove} />
      </span>
      {adding && (
        <AddInline
          parentId={cat.id}
          create={actions.create}
          label=""
          placeholder={`Inside ${cat.name}…`}
          startOpen
          onDone={() => setAdding(false)}
        />
      )}
    </>
  );
}

/** Does this category or anything nested under it match the query? */
function subtreeMatches(all: Cat[], cat: Cat, q: string): boolean {
  if (!q) return true;
  if (cat.name.toLowerCase().includes(q)) return true;
  return childrenOf(all, cat.id).some((k) => subtreeMatches(all, k, q));
}

/** A category with children: collapsible row with chips (or nested groups) inside. */
function Group({
  cat,
  all,
  actions,
  q = "",
}: {
  cat: Cat;
  all: Cat[];
  actions: Actions;
  q?: string;
}) {
  const kids = childrenOf(all, cat.id).filter((k) =>
    subtreeMatches(all, k, q)
  );
  const [openState, setOpen] = useState(false);
  const open = q ? true : openState; // searching auto-opens groups
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100">
      <div
        onClick={() => setOpen(!openState)}
        className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-gray-50"
      >
        <PixelIcon
          name="caret"
          size={12}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        {editing ? (
          <RenameForm cat={cat} update={actions.update} done={() => setEditing(false)} />
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
              {cat.name}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {kids.length}
            </span>
            <IconButton title="Rename" onClick={() => setEditing(true)}>
              <PixelIcon name="pencil" size={11} />
            </IconButton>
            <IconDelete cat={cat} all={all} remove={actions.remove} />
          </>
        )}
      </div>

      {open && (
        <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2 pl-7">
          {kids.map((k) =>
            childrenOf(all, k.id).length > 0 ? (
              <div key={k.id} className="w-full">
                <Group cat={k} all={all} actions={actions} q={q} />
              </div>
            ) : (
              <Chip key={k.id} cat={k} all={all} actions={actions} />
            )
          )}
          <AddInline
            parentId={cat.id}
            create={actions.create}
            label="Add"
            placeholder={`Inside ${cat.name}…`}
          />
        </div>
      )}
    </div>
  );
}

/** Top-level category card. */
function TopCard({
  cat,
  all,
  actions,
  q = "",
}: {
  cat: Cat;
  all: Cat[];
  actions: Actions;
  q?: string;
}) {
  const { icon, label } = splitEmoji(cat.name);
  const groups = childrenOf(all, cat.id).filter((g) =>
    subtreeMatches(all, g, q)
  );
  const subs = descendantCount(all, cat.id);
  const [editing, setEditing] = useState(false);

  return (
    <div className="card flex flex-col gap-3 !p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-gray-900 bg-white text-gray-900">
          <PixelIcon
            name={(icon && EMOJI_ICON[icon]) || "tag"}
            size={28}
          />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <RenameForm cat={cat} update={actions.update} done={() => setEditing(false)} />
          ) : (
            <>
              <div className="truncate font-semibold text-gray-900">{label}</div>
              <div className="text-xs text-gray-400">
                {subs} sub-categories
                {cat.productCount > 0 && ` · ${cat.productCount} products`}
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center">
            <IconButton title="Rename" onClick={() => setEditing(true)}>
              <PixelIcon name="pencil" size={11} />
            </IconButton>
            <IconDelete cat={cat} all={all} remove={actions.remove} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {groups.map((g) => (
          <Group key={g.id} cat={g} all={all} actions={actions} q={q} />
        ))}
        <AddInline
          parentId={cat.id}
          create={actions.create}
          label="Add group"
          placeholder={`Inside ${label}…`}
        />
      </div>
    </div>
  );
}

/* -------------------------------- main --------------------------------- */

export default function CategoryManager({
  cats,
  create,
  update,
  remove,
}: {
  cats: Cat[];
  create: Action;
  update: Action;
  remove: Action;
}) {
  const actions: Actions = { create, update, remove };
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const tops = cats
    .filter((c) => c.parentId === null)
    .filter((t) => subtreeMatches(cats, t, q));

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <PixelIcon
          name="search"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="!pl-9"
        />
      </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tops.map((t) => (
        <TopCard key={t.id} cat={t} all={cats} actions={actions} q={q} />
      ))}

      {/* new top-level category */}
      <div className="flex min-h-28 items-center justify-center border-2 border-dashed border-gray-400 p-4">
        <AddInline
          parentId={null}
          create={create}
          label="New category"
          placeholder="e.g. Frozen"
        />
      </div>
    </div>
    </div>
  );
}
