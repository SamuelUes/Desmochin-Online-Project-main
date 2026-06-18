import type { Metadata } from "next";

import { Faqs } from "@/components/faqs/faqs";

export const metadata: Metadata = {
  title: "FAQs | Pharons Online" ,
};

export default async function FaqsPage() {

    return (
    <main className="relative z-10 pb-12 pt-[136px] sm:pt-36 lg:pt-[136px]">
      <Faqs />
    </main>
  );
}








