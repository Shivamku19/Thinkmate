import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Loading = () => {
  const navigate = useNavigate();
  const{fetchUser}=useAppContext()

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUser()
      navigate("/");
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-linear-to-b dark:from-[#242124] dark:to-[#000000] flex items-center justify-center h-screen w-screen text-emerald-600 dark:text-white text-2xl">
      <div className="w-10 h-10 rounded-full border-3 border-emerald-600 dark:border-white border-t-transparent dark:border-t-transparent animate-spin"></div>
    </div>
  );
};

export default Loading;
