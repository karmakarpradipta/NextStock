import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useResetUserPasswordMutation,
  useToggleUserStatusMutation
} from "../features/auth/usersApiSlice";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import { 
  updateUserSchema, 
  resetPasswordSchema,
  type UpdateUserValues,
  type ResetPasswordValues 
} from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Key, 
  Eye, 
  EyeOff, 
  Wand2, 
  UserCog, 
  ShieldCheck,
  Check,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "../components/ui/skeleton";

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLabel } = useBreadcrumb();

  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  const user = users?.find((u) => u.id === id);

  useEffect(() => {
    if (user && id) {
      setLabel(id, user.name);
    }
  }, [user, id, setLabel]);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetUserPasswordMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleUserStatusMutation();

  // States
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    control: controlProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
  });

  // Password Form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    reset: resetResetForm,
    setValue: setResetValue,
    watch: watchReset,
    formState: { errors: resetErrors, isDirty: isResetDirty },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watchReset("newPassword");

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  }, [user, resetProfile]);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 14; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setResetValue("newPassword", password, { shouldValidate: true, shouldDirty: true });
    setResetValue("confirmPassword", password, { shouldValidate: true, shouldDirty: true });
    setShowPassword(true);
    toast.success("Secure password generated!");
  };

  const handleCopy = () => {
    if (!newPasswordValue) return;
    navigator.clipboard.writeText(newPasswordValue);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const onProfileSubmit = async (data: UpdateUserValues) => {
    if (!id) return;
    try {
      await updateUser({ id, data }).unwrap();
      toast.success("Profile changes saved");
      resetProfile(data);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const onResetSubmit = async (data: ResetPasswordValues) => {
    if (!id) return;
    try {
      await resetPassword({ id, newPassword: data.newPassword }).unwrap();
      toast.success("User password has been updated");
      resetResetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  const onToggleStatus = async () => {
    if (!id) return;
    try {
      await toggleStatus(id).unwrap();
      toast.success(`User ${user?.isActive ? "disabled" : "activated"} successfully`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-8 pb-32 px-4">
      {/* Header Section */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/users")} 
            className="-ml-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to users
          </Button>
          {user && (
            <div className="flex items-center gap-4">
              <Badge variant={user.isActive ? "outline" : "destructive"} className={`h-7 px-3 ${user.isActive ? "text-green-600 border-green-600/20 bg-green-50 dark:bg-green-950/20" : ""}`}>
                {user.isActive ? "Account Active" : "Account Disabled"}
              </Badge>
              <Switch 
                checked={user.isActive} 
                onCheckedChange={onToggleStatus}
                disabled={isToggling}
                className="cursor-pointer" 
              />
            </div>
          )}
        </div>
        
        {isUsersLoading ? (
          <div className="space-y-4 animate-pulse">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-6 w-96 rounded-lg" />
          </div>
        ) : user ? (
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              {user.email} 
              <Separator orientation="vertical" className="h-4 bg-muted-foreground/30" />
              <span className="font-medium text-foreground/80">{user.role}</span>
            </p>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="text-xl font-semibold">User not found</p>
            <Button onClick={() => navigate("/users")} variant="outline" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to User List
            </Button>
          </div>
        )}
      </div>

      <Separator className="opacity-50" />

      {isUsersLoading ? (
        <div className="space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4 space-y-4">
               <Skeleton className="h-10 w-48 rounded-xl" />
               <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <div className="lg:col-span-8 space-y-6">
               <Skeleton className="h-12 w-full rounded-lg" />
               <Skeleton className="h-12 w-full rounded-lg" />
               <Skeleton className="h-12 w-full rounded-lg" />
               <Skeleton className="h-12 w-32 rounded-lg ml-auto" />
            </div>
          </div>
        </div>
      ) : user && (
        <>
          {/* Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <UserCog className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Profile Settings</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Update the user's personal information and account role. These changes reflect across the system immediately.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8"
            >
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-8">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name" className="text-sm font-semibold ml-1">Full Name</Label>
                    <Input id="name" {...registerProfile("name")} disabled={isUpdating} className="h-12 bg-background text-base px-4" />
                    {profileErrors.name && <p className="text-xs font-medium text-destructive ml-1">{profileErrors.name.message}</p>}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Address</Label>
                    <Input id="email" type="email" {...registerProfile("email")} disabled={isUpdating} className="h-12 bg-background text-base px-4" />
                    {profileErrors.email && <p className="text-xs font-medium text-destructive ml-1">{profileErrors.email.message}</p>}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="role" className="text-sm font-semibold ml-1">User Role</Label>
                    <Controller
                      name="role"
                      control={controlProfile}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isUpdating}>
                          <SelectTrigger className="h-12 bg-background text-base px-4 cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STAFF" className="cursor-pointer py-3">Staff Member</SelectItem>
                            <SelectItem value="ADMIN" className="cursor-pointer py-3">Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isUpdating || !isProfileDirty} className="h-12 px-8 text-base font-bold shadow-sm cursor-pointer">
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-5 w-5" />
                    )}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>

          <Separator className="opacity-50" />

          {/* Security Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Security & Access</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Manage authentication credentials. Use the security wand to generate high-entropy passwords.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-8"
            >
              <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-8">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="newPassword" className="text-sm font-semibold ml-1">New Password</Label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          {...registerReset("newPassword")}
                          disabled={isResetting}
                          placeholder="Enter a secure password"
                          className="h-12 bg-background text-base px-4 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generatePassword}
                        className="h-12 w-12 cursor-pointer border-dashed hover:border-primary hover:text-primary transition-all p-0 bg-background"
                        title="Generate secure password"
                      >
                        <Wand2 className="h-5 w-5" />
                      </Button>
                      <AnimatePresence>
                        {newPasswordValue && (
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              onClick={handleCopy}
                              className="h-12 w-12 cursor-pointer bg-background"
                            >
                              {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {resetErrors.newPassword && <p className="text-xs font-medium text-destructive ml-1">{resetErrors.newPassword.message}</p>}
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold ml-1">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      {...registerReset("confirmPassword")}
                      disabled={isResetting}
                      placeholder="Re-type password to confirm"
                      className="h-12 bg-background text-base px-4"
                    />
                    {resetErrors.confirmPassword && <p className="text-xs font-medium text-destructive ml-1">{resetErrors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="destructive" disabled={isResetting || !isResetDirty} className="h-12 px-8 text-base font-bold shadow-sm cursor-pointer">
                    {isResetting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-5 w-5" />
                    )}
                    Update User Password
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default EditUser;
