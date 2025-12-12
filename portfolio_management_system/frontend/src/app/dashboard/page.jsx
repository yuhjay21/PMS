import DashboardPageClient from './DashboardPageClient';
import { cookies } from "next/headers";

export const metadata = {
  title: 'Dashboard | Portfolio',
};
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default async function DashboardPage() {

  const cookieStore = await cookies();

  const res = await fetch(`${API_BASE}/accounts/me/`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const user = await res.json();

  return <DashboardPageClient />;
}
