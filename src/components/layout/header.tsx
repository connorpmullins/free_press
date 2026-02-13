"use client";

import Link from "next/link";
import { useUser } from "@/components/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Search,
  Bookmark,
  PenSquare,
  LayoutDashboard,
  DollarSign,
  Shield,
  LogOut,
  User,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-6xl items-center mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <span className="font-bold text-xl tracking-tight">Free Press</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link href="/feed">
            <Button variant="ghost" size="sm">
              Feed
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </Link>
          <Link href="/feedback">
            <Button variant="ghost" size="sm">
              <Lightbulb className="h-4 w-4 mr-1" />
              Feedback
            </Button>
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {/* Bookmarks */}
              <Link href="/bookmarks" className="hidden md:inline-flex">
                <Button variant="ghost" size="icon">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </Link>

              {/* Write button for journalists */}
              {user.role === "JOURNALIST" && (
                <Link href="/journalist/write" className="hidden md:inline-flex">
                  <Button size="sm" variant="outline">
                    <PenSquare className="h-4 w-4 mr-1" />
                    Write
                  </Button>
                </Link>
              )}

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {user.role === "JOURNALIST" &&
                      user.journalistProfile?.verificationStatus ===
                        "VERIFIED" && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <User className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>

                  {user.role === "JOURNALIST" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/journalist/dashboard")}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/journalist/revenue")}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Revenue
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => router.push("/bookmarks")}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmarks
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm">Subscribe</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-2 mt-6">
                <Link
                  href="/feed"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted"
                >
                  Feed
                </Link>
                <Link
                  href="/search"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted"
                >
                  Search
                </Link>
                <Link
                  href="/feedback"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md hover:bg-muted"
                >
                  Feedback
                </Link>
                {user && (
                  <>
                    <Link
                      href="/bookmarks"
                      onClick={() => setMobileOpen(false)}
                      className="px-3 py-2 rounded-md hover:bg-muted"
                    >
                      Bookmarks
                    </Link>
                    {user.role === "JOURNALIST" && (
                      <>
                        <Link
                          href="/journalist/write"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-2 rounded-md hover:bg-muted"
                        >
                          Write Article
                        </Link>
                        <Link
                          href="/journalist/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-2 rounded-md hover:bg-muted"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href="/journalist/revenue"
                          onClick={() => setMobileOpen(false)}
                          className="px-3 py-2 rounded-md hover:bg-muted"
                        >
                          Revenue
                        </Link>
                      </>
                    )}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="px-3 py-2 rounded-md hover:bg-muted"
                      >
                        Admin
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
