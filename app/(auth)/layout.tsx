import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between font-inter">
        {children}
        <div className="auth-asset">
          <div>
            <Image
              src="/icons/auth-image.png"
              alt="Auth image"
              width={700}
              height={700}
              className="rounded-l-3xl border-t-4 border-b-4 border-l-4 border-custom-blue"
            />
          </div>
        </div>
    </main>
  );
}