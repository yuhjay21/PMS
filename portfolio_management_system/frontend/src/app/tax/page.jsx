import '@/styles/globals.css';
import { cookies } from "next/headers";
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'react-hot-toast';

export const metadata = {
  title: 'Tax Overview | Portfolio',
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const API_VER =
  process.env.NEXT_PUBLIC_API_VER_URL ;

export default async function ProfileSettingsPage() {

  const cookieStore = await cookies();

  const res = await fetch(`${process.env.API_BASE}/accounts/me/`, {
    method: "GET",
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const user = await res.json();

  return (
    <div className="page-content">
      
    </div>
  );
}