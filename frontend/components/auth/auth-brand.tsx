import { SpadeIcon } from "@/components/ui/icons";

export function AuthBrand() {
  return (
    <span className="mx-auto flex w-fit items-center gap-3">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f7b832]/70 shadow-[0_0_24px_rgba(247,184,50,0.24)]">
        <SpadeIcon className="h-9 w-9" />
      </span>
      <span className="leading-none">
        <span className="block text-xl font-extrabold tracking-normal">
          Pharons Online 
        </span>
        <span className="mt-1 block text-[13px] font-extrabold text-[#f7d273]">
          TU MESA, TUS REGLAS
        </span>
      </span>
    </span>
  );
}
