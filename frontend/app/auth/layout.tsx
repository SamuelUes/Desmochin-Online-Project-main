export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex min-h-screen flex-col bg-[#03050d] text-white">
      {children}
    </section>
  );
}
