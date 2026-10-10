"use client";

import { useState } from "react";

import SignInForm from "@/components/auth/sign-in-form";
import SignUpForm from "@/components/auth/sign-up-form";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex flex-1 items-center justify-center">
      {children}
    </main>
  )
}

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return showSignIn ? (
    <Container>
      <SignUpForm onSwitchToSignIn={() => setShowSignIn(false)} />
    </Container>
  ) : (
    <Container>
      <SignInForm onSwitchToSignUp={() => setShowSignIn(true)} />
    </Container>
  );
}
