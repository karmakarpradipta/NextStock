import { useState } from "react";
import { Button } from "../ui/button";
import { RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    onGenerate(password);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password Generator</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generatePassword}
          className="h-8 text-xs h-7 px-2"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Generate
        </Button>
      </div>
      
      {generatedPassword && (
        <div className="flex items-center gap-2 bg-background border rounded px-3 py-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <code className="flex-1 font-mono text-sm font-bold tracking-tight text-primary">
            {generatedPassword}
          </code>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={copyToClipboard}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground italic">
        Generates a secure 12-character password.
      </p>
    </div>
  );
}
