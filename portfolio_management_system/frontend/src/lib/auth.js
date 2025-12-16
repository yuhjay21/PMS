import { toast  } from 'react-hot-toast';

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const API_VER =
  process.env.NEXT_PUBLIC_API_VER_URL;

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/accounts/me/`, {
    method: "GET",
    credentials: "include",
  });
  
  
  if (!res.ok) {
    toast('Problem with /Accounts/me endpoint');
    return null;}
   
  const result = await res.json();
  return result ;
}