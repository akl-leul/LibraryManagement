// components/Layout.js
import { ReactNode } from "react";
import Navbar from "./Navbar"; // You'll need to create and style this component 

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col antialiased">
      {/*
        `flex flex-col`: Ensures children (Navbar, main, Footer) stack vertically.
        `min-h-screen`: Makes the layout take at least the full viewport height.
        `antialiased`: Improves font rendering.
      */}
      <Navbar /> {/* Your site's navigation bar */}
      <main className="flex-1">
        {/*
          `flex-1`: Allows the main content area to grow and fill available space
          (shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0%).
          The page content (children) will determine its own padding and container type.
        */}
        {children}
      </main>
      {/* Optional: You could add a <Footer /> component here */}
      {/* <Footer /> */}
    </div>
  );
}