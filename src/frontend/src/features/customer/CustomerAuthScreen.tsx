import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@caffeineai/core-infrastructure";
import { useState } from "react";
import { createActor } from "../../backend";

interface CustomerAuthScreenProps {
  onAuthenticated: (username: string, password: string) => void;
}

type AuthTab = "signin" | "signup";

export default function CustomerAuthScreen({
  onAuthenticated,
}: CustomerAuthScreenProps) {
  const { actor, isFetching } = useActor(createActor);
  const [tab, setTab] = useState<AuthTab>("signin");

  // Sign in state
  const [siUsername, setSiUsername] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siError, setSiError] = useState("");
  const [siLoading, setSiLoading] = useState(false);

  // Sign up state
  const [suUsername, setSuUsername] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suError, setSuError] = useState("");
  const [suLoading, setSuLoading] = useState(false);

  const handleSignIn = async () => {
    if (!siUsername.trim() || !siPassword) {
      setSiError("Please enter your username and password.");
      return;
    }
    if (!actor) {
      setSiError("Not connected. Please try again.");
      return;
    }
    setSiLoading(true);
    setSiError("");
    try {
      const result = await actor.signIn(siUsername.trim(), siPassword);
      if (result.__kind__ === "ok") {
        onAuthenticated(siUsername.trim(), siPassword);
      } else {
        setSiError(result.err);
      }
    } catch {
      setSiError("Sign in failed. Please try again.");
    } finally {
      setSiLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!suUsername.trim() || !suPassword || !suConfirm) {
      setSuError("Please fill in all fields.");
      return;
    }
    if (suPassword !== suConfirm) {
      setSuError("Passwords do not match.");
      return;
    }
    if (suPassword.length < 4) {
      setSuError("Password must be at least 4 characters.");
      return;
    }
    if (!actor) {
      setSuError("Not connected. Please try again.");
      return;
    }
    setSuLoading(true);
    setSuError("");
    try {
      const result = await actor.signUp(suUsername.trim(), suPassword);
      if (result.__kind__ === "ok") {
        onAuthenticated(suUsername.trim(), suPassword);
      } else {
        setSuError(result.err);
      }
    } catch {
      setSuError("Sign up failed. Please try again.");
    } finally {
      setSuLoading(false);
    }
  };

  const isActorReady = !!actor && !isFetching;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/assets/generated/pos-logo.dim_512x512.png"
            alt="W Café logo"
            className="w-16 h-16 rounded-full object-cover shadow-md"
          />
          <h1 className="text-3xl font-bold text-foreground">The W Café</h1>
          <p className="text-muted-foreground text-sm">
            Order online & earn rewards
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 space-y-6">
          {/* Tab toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button
              type="button"
              data-ocid="auth.signin.tab"
              onClick={() => {
                setTab("signin");
                setSiError("");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              data-ocid="auth.signup.tab"
              onClick={() => {
                setTab("signup");
                setSuError("");
              }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted/50"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Sign In form */}
          {tab === "signin" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSignIn();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="si-username">Username</Label>
                <Input
                  id="si-username"
                  data-ocid="auth.signin.username.input"
                  placeholder="Your username"
                  value={siUsername}
                  onChange={(e) => {
                    setSiUsername(e.target.value);
                    setSiError("");
                  }}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Password</Label>
                <Input
                  id="si-password"
                  data-ocid="auth.signin.password.input"
                  type="password"
                  placeholder="Your password"
                  value={siPassword}
                  onChange={(e) => {
                    setSiPassword(e.target.value);
                    setSiError("");
                  }}
                  autoComplete="current-password"
                />
              </div>
              {siError && (
                <Alert
                  variant="destructive"
                  data-ocid="auth.signin.error_state"
                >
                  <AlertDescription>{siError}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                data-ocid="auth.signin.submit_button"
                className="w-full"
                disabled={siLoading || !isActorReady}
              >
                {siLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          )}

          {/* Sign Up form */}
          {tab === "signup" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSignUp();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="su-username">Username</Label>
                <Input
                  id="su-username"
                  data-ocid="auth.signup.username.input"
                  placeholder="Choose a username"
                  value={suUsername}
                  onChange={(e) => {
                    setSuUsername(e.target.value);
                    setSuError("");
                  }}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  data-ocid="auth.signup.password.input"
                  type="password"
                  placeholder="Choose a password"
                  value={suPassword}
                  onChange={(e) => {
                    setSuPassword(e.target.value);
                    setSuError("");
                  }}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-confirm">Confirm Password</Label>
                <Input
                  id="su-confirm"
                  data-ocid="auth.signup.confirm.input"
                  type="password"
                  placeholder="Confirm your password"
                  value={suConfirm}
                  onChange={(e) => {
                    setSuConfirm(e.target.value);
                    setSuError("");
                  }}
                  autoComplete="new-password"
                />
              </div>
              {suError && (
                <Alert
                  variant="destructive"
                  data-ocid="auth.signup.error_state"
                >
                  <AlertDescription>{suError}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                data-ocid="auth.signup.submit_button"
                className="w-full"
                disabled={suLoading || !isActorReady}
              >
                {suLoading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
