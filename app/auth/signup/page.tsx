// Server component — force-dynamic prevents prerendering at build time,
// keeping the Supabase client out of the static generation phase.
export const dynamic = "force-dynamic";

import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <SignupForm />
    </div>
  );
}
