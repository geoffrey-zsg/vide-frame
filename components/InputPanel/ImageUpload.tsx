'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface ImageUploadProps {
  image: string | null;
  onImageChange: (base64: string | null) => void;
}

export function ImageUpload({ image, onImageChange }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onImageChange(base64);
    };
    reader.readAsDataURL(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  if (image) {
    return (
      <div className="relative p-2 group">
        <div className="absolute inset-2 bg-slate-100 rounded-2xl shadow-inner -z-10"></div>
        <img
          src={`data:image/png;base64,${image}`}
          alt="uploaded sketch"
          className="max-h-48 w-full object-contain rounded-2xl border border-slate-200 shadow-sm transition-transform duration-300 ease-in-out group-hover:shadow-md"
        />
        <button
          type="button"
          onClick={() => onImageChange(null)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/70 text-white text-sm opacity-0 group-hover:opacity-100 backdrop-blur-sm hover:bg-red-500/90 hover:scale-105 transition-all duration-200 shadow-sm"
          aria-label="Remove image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200 ease-in-out ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50/50 scale-[0.98]'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100/80 shadow-sm hover:shadow'
        }`}
      >
        <div className="p-3 bg-white rounded-full shadow-sm">
          <svg
            className="w-6 h-6 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          拖拽草图到此处，或<span className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">点击上传</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
