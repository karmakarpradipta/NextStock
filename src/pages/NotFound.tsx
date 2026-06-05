import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import notFoundSvg from "../assets/404.svg";

const NotFound = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-6 md:p-10 text-center">
      <div className="flex w-full max-w-md flex-col gap-6 items-center">
        <img src={notFoundSvg} alt="404" className="w-64 h-auto" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-xl font-medium">Page not found</p>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <Button asChild className="h-11 px-8">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
