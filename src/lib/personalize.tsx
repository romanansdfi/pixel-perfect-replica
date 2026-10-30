import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Camera } from "lucide-react";

/**
 * Personalise mode: lets the couple edit every text and upload their own
 * photos directly on the site. Everything is saved to this device's
 * localStorage, so it never overrides the published defaults for her.
 */

type Store = {
  texts: Record<string, string>;
  photos: Record<string, string>;
  gallery: { src: string; caption: string }[];
};

const EMPTY: Store = { texts: {}, photos: {}, gallery: [] };
const KEY = "puja-birthday-v1";

type Ctx = {
  edit: boolean;
  setEdit: (v: boolean) => void;
  text: (id: string, fallback: string) => string;
  setText: (id: string, v: string) => void;
  photo: (id: string) => string | null;
  setPhoto: (id: string, dataUrl: string | null) => void;
  galleryPhotos: { src: string; caption: string }[] | null;
  setGalleryPhotos: (items: { src: string; caption: string }[]) => void;
  reset: () => void;
};

const PersonalizeContext = createContext<Ctx | null>(null);

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return EMPTY;
  }
}

export function PersonalizeProvider({ children }: { children: ReactNode }) {
  const [edit, setEdit] = useState(false);
  const [store, setStore] = useState<Store>(EMPTY);

  useEffect(() => {
    setStore(readStore());
  }, []);

  const update = useCallback((next: Store) => {
    setStore(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage full — photos too large; keep in memory for this visit
    }
  }, []);

  const value: Ctx = {
    edit,
    setEdit,
    text: (id, fallback) => store.texts[id] ?? fallback,
    setText: (id, v) => update({ ...store, texts: { ...store.texts, [id]: v } }),
    photo: (id) => store.photos[id] ?? null,
    setPhoto: (id, dataUrl) =>
      update({
        ...store,
        photos: { ...store.photos, [id]: dataUrl ?? "" },
      }),
    galleryPhotos: store.gallery.length ? store.gallery : null,
    setGalleryPhotos: (items) => update({ ...store, gallery: items }),
    reset: () => {
      update(EMPTY);
      setStore(EMPTY);
    },
  };

  return <PersonalizeContext.Provider value={value}>{children}</PersonalizeContext.Provider>;
}

export function usePersonalize() {
  const ctx = useContext(PersonalizeContext);
  if (!ctx) throw new Error("usePersonalize must be used inside PersonalizeProvider");
  return ctx;
}

/* ---------------- Editable text ---------------- */

type EditableTextProps = {
  id: string;
  fallback: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div";
  className?: string;
  multiline?: boolean;
  softWrap?: boolean;
};

export function EditableText({ id, fallback, as = "span", className, multiline, softWrap }: EditableTextProps) {
  const { edit, text, setText } = usePersonalize();
  const value = text(id, fallback);
  const Tag = as;
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (edit && ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [edit, value]);

  if (edit) {
    return (
      <textarea
        ref={ref}
        defaultValue={value}
        onBlur={(e: ChangeEvent<HTMLTextAreaElement>) => setText(id, e.target.value)}
        rows={1}
        wrap={softWrap ? "soft" : "off"}
        spellCheck={false}
        className={`editable-hint w-full resize-none bg-transparent font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit] text-center ${className ?? ""}`}
        {...({ "data-editable": id } as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return (
    <Tag className={multiline ? className : className}>
      {multiline ? (
        value.split("\n\n").map((para, i) => (
          <span key={i} className="block">
            {i > 0 && <span className="block h-4" />}
            {para}
          </span>
        ))
      ) : (
        value
      )}
    </Tag>
  );
}

/* ---------------- Photo slot ---------------- */

type PhotoSlotProps = {
  id: string;
  /** shown when no photo is uploaded yet */
  fallback: ReactNode;
  className?: string;
  imgClassName?: string;
  alt?: string;
  eager?: boolean;
};

export function PhotoSlot({ id, fallback, className, imgClassName, alt = "Our photo", eager }: PhotoSlotProps) {
  const { edit, photo, setPhoto } = usePersonalize();
  const src = photo(id);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(id, String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {src ? (
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className={`h-full w-full object-cover ${imgClassName ?? ""}`} />
      ) : (
        fallback
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {edit && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-burgundy/35 text-cream backdrop-blur-[2px] transition-colors hover:bg-burgundy/50"
        >
          <Camera className="h-7 w-7" />
          <span className="text-xs font-medium tracking-wide">
            {src ? "Change photo" : "Add photo"}
          </span>
        </button>
      )}
    </div>
  );
}
