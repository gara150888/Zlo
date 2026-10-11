"use client";

import { useRef, useState } from "react";
import { ImagePlus, LinkIcon, SearchIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import type { Logo } from "@/components/layout/logos/logo-library";
import { LogoPicker } from "@/components/layout/logos/logo-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Uploaded logos are inlined as data URLs, so keep them small. */
const MAX_UPLOAD_BYTES = 192 * 1024;

export type LogoFieldProps = {
  value: string;
  onChange: (logoUrl: string) => void;
  /** Called with the logo's display name so the provider can be filled in. */
  onProviderChange: (name: string) => void;
  /** Shown in the preview while no logo is set. */
  fallbackText: string;
};

export function LogoField({
  value,
  onChange,
  onProviderChange,
  fallbackText,
}: LogoFieldProps) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLogo = value.trim() !== "";
  const showImage = hasLogo && !imageFailed;

  const handlePick = (logo: Logo) => {
    setImageFailed(false);
    onChange(logo.svg.icon);
    onProviderChange(logo.name);
    setOpen(false);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for the logo.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Keep the logo image under 192 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast.error("Could not read that image.");
    reader.onload = () => {
      setImageFailed(false);
      onChange(String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background">
          {showImage ? (
            <img
              src={value}
              alt=""
              className="size-full object-contain p-1"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="text-[0.625rem] font-medium text-muted-foreground">
              {fallbackText.slice(0, 2).toUpperCase() || "?"}
            </span>
          )}
        </span>

        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger render={<Button variant="outline" size="default" />}>
            <SearchIcon />
            Search logos
          </PopoverTrigger>
          <PopoverContent className="w-[22rem]" align="start">
            <LogoPicker
              onSelect={handlePick}
              onCustom={() => {
                setOpen(false);
                fileInputRef.current?.click();
              }}
            />
          </PopoverContent>
        </Popover>
        {/* 
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus />
          Upload
        </Button> */}

        {hasLogo ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove logo"
            className="ml-auto"
            onClick={() => {
              setImageFailed(false);
              onChange("");
            }}
          >
            <XIcon />
          </Button>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload a custom logo"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <div className="relative">
        <LinkIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="logoUrl"
          name="logoUrl"
          value={value}
          onChange={(event) => {
            setImageFailed(false);
            onChange(event.target.value);
          }}
          placeholder="Or paste a logo URL"
          className="pl-8"
        />
      </div>
    </div>
  );
}
