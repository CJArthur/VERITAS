"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, ImageIcon } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
  currentUrl?: string | null;
  label?: string;
  folder?: string;
  onUploaded: (url: string) => void;
  aspectClass?: string;
}

export function CloudinaryUpload({
  currentUrl,
  label = "Загрузить изображение",
  folder = "veritas",
  onUploaded,
  aspectClass = "aspect-square",
}: CloudinaryUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Файл слишком большой (макс. 5 МБ)"); return; }
    setError(""); setLoading(true);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    try {
      const result = await uploadToCloudinary(file, folder);
      onUploaded(result.secure_url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
      setPreview(currentUrl ?? null);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 overflow-hidden cursor-pointer group hover:border-[#a05c20] transition-colors",
          aspectClass
        )}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <>
            <Image src={preview} alt="" fill className="object-cover" unoptimized={preview.startsWith("blob:")} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
            <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
            <span className="text-xs font-medium">{label}</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
