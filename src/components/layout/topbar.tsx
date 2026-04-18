"use client";

import { useAuth } from "@/providers/auth-provider";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)] flex items-center justify-between px-6">
      {/* Left: date */}
      <div className="flex items-center gap-4 md:pl-0 pl-10">
        <span className="text-sm text-[var(--muted-foreground)]">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </span>
      </div>

      {/* Right: alerts + user */}
      <div className="flex items-center gap-3">
        {/* Alerts placeholder */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-[var(--muted-foreground)]" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[var(--primary)] text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none">
                  {profile?.full_name || "User"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {profile?.role || "viewer"}
                  </Badge>
                </div>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {profile?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
