import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipeez",
  description: "Recipe management and meal planning"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("recipeez-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}else{document.documentElement.removeAttribute("data-theme")}}catch(e){}`
          }}
        />
      </head>
      <body>
        <header className="topbar">
          <Link href="/recipes" className="brand">
            Recipeez
          </Link>
          <div className="topbar-actions">
            <nav>
              <Link href="/recipes">Recipes</Link>
              <Link href="/meal-plans">Meal Plans</Link>
            </nav>
            <ThemeToggle />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
