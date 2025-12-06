"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-row w-full items-center justify-center  bg-[#211811] ">
      <div className="max-w-7xl w-full  border-b border-[#4f4338] flex flex-row items-center justify-between py-4 ">
        <div className=" text-white font-bold text-2xl items-center justify-center">
          <h1 className="">ConnectApp</h1>
        </div>
        <div className="flex flex-row space-x-6 items-center justify-center">
          <Link href="/Features" className="text-white">
            Features
          </Link>
          <Link href="/Pricing" className="text-white">
            Pricing
          </Link>
          <SignInButton mode="modal">
            <button className="text-white bg-transparent border py-2 px-4 rounded-full hover:bg-[#cf6213] transition">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-white bg-[#e67919] py-2 px-4 rounded-full hover:bg-[#cf6213] transition">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>
    </header>
  );
}
