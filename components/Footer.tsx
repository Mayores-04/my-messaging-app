"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-[#53473c] px-6 py-12 text-[#b8aa9d] bg-[#211811] w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-3">
              {/* <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">◧</div> */}
              <span className="text-white text-lg font-semibold">ConnectApp</span>
            </div>
            <p className="text-sm max-w-xs">Your calm space for connection.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#" className="text-sm hover:text-secondary">Features</Link>
              <Link href="#" className="text-sm hover:text-secondary">Pricing</Link>
              <Link href="#" className="text-sm hover:text-secondary">Download</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#" className="text-sm hover:text-secondary">About Us</Link>
              <Link href="#" className="text-sm hover:text-secondary">Blog</Link>
              <Link href="#" className="text-sm hover:text-secondary">Contact</Link>
            </nav>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <nav className="flex flex-col gap-2">
              <Link href="#" className="text-sm hover:text-secondary">Privacy Policy</Link>
              <Link href="#" className="text-sm hover:text-secondary">Terms of Service</Link>
            </nav>
          </div>
        </div>

        <div className="pt-6 border-t border-border-dark text-center text-sm text-subtle-dark">
          © {new Date().getFullYear()} ConnectApp. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
