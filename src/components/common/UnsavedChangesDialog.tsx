import { useBlocker } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface UnsavedChangesDialogProps {
  isDirty: boolean;
}

export const UnsavedChangesDialog = ({ isDirty }: UnsavedChangesDialogProps) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <Dialog open={blocker.state === "blocked"} onOpenChange={() => blocker.reset?.()}>
      <DialogContent className="max-w-md rounded-lg border-none p-10 bg-card">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shadow-xl shadow-destructive/10">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                Unsaved Changes
              </DialogTitle>
              <DialogDescription className="font-medium text-muted-foreground uppercase text-[10px] tracking-widest">
                Potential Data Loss
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have unsaved changes in this form. If you leave now, all your progress will be permanently lost. Are you sure you want to proceed?
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => blocker.reset?.()}
            className="flex-1 h-12 rounded-md font-bold text-muted-foreground cursor-pointer"
          >
            Stay & Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.proceed?.()}
            className="flex-1 h-12 rounded-md font-bold shadow-lg shadow-destructive/20 cursor-pointer"
          >
            Leave Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
