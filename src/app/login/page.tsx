"use client";
import React from "react";
import { LoginPage } from "@/components/LoginPage";

export default function Page() {
  // This route is kept for backwards compatibility.
  // The app UX uses the home route + a LoginPage overlay instead of navigating to /login.
  return <LoginPage />;
}
