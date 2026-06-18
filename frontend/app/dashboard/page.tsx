import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default function Page() {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#03050d] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(247,184,50,0.2),transparent_27%),radial-gradient(circle_at_18%_28%,rgba(60,74,102,0.24),transparent_26%),linear-gradient(110deg,#02040b_0%,#07101e_48%,#05070e_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:76px_76px]" />
      <div className="absolute left-[8%] top-[18%] h-48 w-48 rounded-full bg-[#f7b832]/10 blur-3xl" />
      <div className="absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-[#f7b832]/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 max-[520px]:mx-0 max-[520px]:max-w-[390px] sm:px-6 lg:px-8">
            
            <Link href="/">Back</Link>
        </div>

    </main>
  )
}
