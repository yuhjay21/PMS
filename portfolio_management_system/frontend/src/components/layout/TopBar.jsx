'use client';
import { useEffect, useState  } from 'react';
import { getCurrentUser } from "@/lib/auth";
import { toast  } from 'react-hot-toast';

export default function TopBar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);          // u can be null if not logged in
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    toast("Logged In as ")
  }, [user]);
  
  return (
    <header className="topbar">
      <div className="topbar-title">Portfolio Dashboard</div>
      <div className="topbar-right fw-bold text-white">{loading ? ("Checking login...") 
                                                                : user ? (<>Logged in as: {user.username} ({new Date().toDateString()})</>) 
                                                                       : ("Not logged in")}
      </div>
    </header>
  );
}
