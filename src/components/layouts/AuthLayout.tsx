import { Outlet, Link } from "react-router-dom";
import { Package2 } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { motion } from "framer-motion";

const AuthLayout = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10 transition-colors duration-500">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex w-full max-w-sm flex-col gap-6"
      >
        <Link to="/" className="flex items-center gap-2 self-center font-bold text-2xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package2 className="h-5 w-5" />
          </div>
          NextStock
        </Link>
        <Outlet />
      </motion.div>
    </div>
  );
};

export default AuthLayout;
