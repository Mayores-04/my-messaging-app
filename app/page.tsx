"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex flex-col items-center bg-[#211811]">
      <Header />
      <div className="w-full max-w-7xl mx-auto px-6 py-16">
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-white py-6">
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl md:text-7xl font-semibold">Your calm space for connection.</h1>
            <p className="text-sm md:text-base max-w-xl text-[#b8aa9d]">
              A messaging app designed for meaningful conversations that feel
              like coffee with a friend.
            </p>
            <button className="mt-4 inline-block bg-[#e67919] w-70 px-6 py-4 rounded-lg text-white font-semibold text-lg md:text-xl hover:bg-[#cf6213] transition">
              Download for Desktop
            </button>
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="/images/hero-image.png"
              alt="Hero Image"
              width={560}
              height={360}
              className="rounded-xl shadow-lg object-cover"
            />
          </div>
        </section>

        <section className="flex flex-col my-20 justify-center items-center text-white gap-10">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h1 className="text-3xl md:text-5xl font-bold">Experience seamless communication</h1>
            <p className="text-base md:text-lg text-[#b8aa9d] max-w-2xl">Everything you need to stay connected, without the clutter.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            <div className="flex flex-col p-6 bg-[#26211c] rounded-xl border border-[#c9a685] gap-3">
              <h2 className="text-white font-semibold text-xl">Seamless Syncing</h2>
              <p className="text-[#b8aa9d] text-sm">Keep your conversations updated across all your devices, instantly.</p>
            </div>
            <div className="flex flex-col p-6 bg-[#26211c] rounded-xl border border-[#c9a685] gap-3">
              <h2 className="text-white font-semibold text-xl">Focus Mode</h2>
              <p className="text-[#b8aa9d] text-sm">Tune out the noise and concentrate on what matters most.</p>
            </div>
            <div className="flex flex-col p-6 bg-[#26211c] rounded-xl border border-[#c9a685] gap-3">
              <h2 className="text-white font-semibold text-xl">Secure & Private</h2>
              <p className="text-[#b8aa9d] text-sm">End-to-end encryption ensures your conversations are always private.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col my-20 justify-center items-center text-white py-10">
            <div className="flex flex-col p-8 md:p-12 bg-[#26211c] rounded-xl items-center justify-center w-full max-w-4xl gap-4 text-center">
              <h2 className="text-white font-bold text-2xl md:text-3xl">Ready to start chatting?</h2>
              <p className="text-[#b8aa9d] text-base md:text-lg max-w-2xl">Join the conversation and experience a messaging app that's built for connection, not distraction.</p>
              <button className="mt-4 inline-block bg-[#e67919] max-w-md px-8 py-4 rounded-lg text-white font-semibold text-lg md:text-xl hover:bg-[#cf6213] transition">
                Get Started for Free
              </button>
            </div>
        </section>
      </div>
      <Footer />

    </main>
  );
}
