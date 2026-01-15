"use client";

import type React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  backdropClassName = "bg-black/30",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${backdropClassName} backdrop-blur-sm`}
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20 transform transition-all duration-300 scale-100 ${className}`}
        onClick={(e) => e.stopPropagation()} // Fixed: was "e biomaterials.stopPropagation()"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200/60">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}