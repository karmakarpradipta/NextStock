import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectCurrentUser, setCredentials } from "../features/auth/authSlice";
import { useUpdateUserMutation, useResetUserPasswordMutation } from "../features/auth/usersApiSlice";
import { updateUserSchema, resetPasswordSchema, type UpdateUserValues, type ResetPasswordValues } from "../lib/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { 
  User, 
  Mail, 
  Shield, 
  KeyRound, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Camera,
  Settings2,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Profile = () => {
  const user = useAppSelector(selectCurrentUser);
  const token = useAppSelector(state => state.auth.token);
  const dispatch = useAppDispatch();
  
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateUserMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile
  } = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "STAFF",
    },
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onUpdateProfile = async (data: UpdateUserValues) => {
    if (!user?.id) return;
    try {
      const updatedUser = await updateProfile({ id: user.id, data }).unwrap();
      // Update local storage/state via slice
      dispatch(setCredentials({ user: updatedUser, token: token! }));
      toast.success("Profile information updated successfully");
      resetProfile(data);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const onUpdatePassword = async (data: ResetPasswordValues) => {
    if (!user?.id) return;
    try {
      await resetPassword({ id: user.id, newPassword: data.newPassword }).unwrap();
      toast.success("Password changed successfully");
      resetPasswordForm();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-10 rounded-[2.5rem] shadow-sm border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative group">
          <Avatar className="h-32 w-32 rounded-3xl border-4 border-background shadow-2xl">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-black">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <button className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-transform cursor-pointer">
             <Camera className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center md:text-left space-y-3 flex-1">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">{user.name}</h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
             <Badge className="bg-primary text-primary-foreground hover:bg-primary font-black tracking-widest px-4 py-1.5 rounded-full uppercase text-[10px]">
                {user.role}
             </Badge>
             <Badge variant="outline" className="font-bold px-4 py-1.5 rounded-full border-border bg-accent text-accent-foreground text-[10px] uppercase tracking-widest">
                Active Account
             </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border border-border shadow-md rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-primary border border-border shadow-sm">
                   <User className="h-5 w-5" />
                </div>
                <div>
                   <CardTitle className="text-2xl font-black tracking-tight">Account Details</CardTitle>
                   <CardDescription className="text-sm font-medium">Update your public profile and contact info.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Full Name</Label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        id="name" 
                        {...registerProfile("name")} 
                        className="h-12 pl-10 border-none bg-muted/50 rounded-xl font-bold text-foreground"
                        disabled={isUpdatingProfile}
                       />
                    </div>
                    {profileErrors.name && (
                      <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1">{profileErrors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Email Address</Label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        id="email" 
                        type="email" 
                        {...registerProfile("email")} 
                        className="h-12 pl-10 border-none bg-muted/50 rounded-xl font-bold text-foreground"
                        disabled={isUpdatingProfile}
                       />
                    </div>
                    {profileErrors.email && (
                      <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1">{profileErrors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">System Role</Label>
                   <div className="flex items-center gap-3 p-4 bg-muted/20 border border-border rounded-2xl">
                      <Shield className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                         <p className="text-sm font-bold text-foreground">{user.role === 'ADMIN' ? 'Full Administrator' : 'Staff Member'}</p>
                         <p className="text-[10px] font-medium text-muted-foreground italic">Your role defines your access levels across the system.</p>
                      </div>
                      <Lock className="h-4 w-4 text-muted-foreground/50" />
                   </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={!isProfileDirty || isUpdatingProfile}
                  className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 transition-all cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Save Profile Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Security / Password */}
        <div className="lg:col-span-5 space-y-8">
           <Card className="border border-border shadow-md rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="p-8 border-b border-border bg-muted/20">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-destructive border border-border shadow-sm">
                     <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                     <CardTitle className="text-2xl font-black tracking-tight">Security</CardTitle>
                     <CardDescription className="text-sm font-medium">Update your account credentials.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="newPassword" 
                      type="password" 
                      {...registerPassword("newPassword")} 
                      placeholder="Min 6 characters"
                      className="h-12 pl-10 border-none bg-muted/50 rounded-xl font-bold text-foreground"
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Confirm New Password</Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      {...registerPassword("confirmPassword")} 
                      placeholder="Re-enter password"
                      className="h-12 pl-10 border-none bg-muted/50 rounded-xl font-bold text-foreground"
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl">
                   <p className="text-[10px] font-black text-destructive uppercase tracking-widest leading-relaxed text-center">
                     Changing your password will require you to log in again on all other devices.
                   </p>
                </div>

                <Button 
                  type="submit" 
                  variant="outline" 
                  disabled={isResettingPassword}
                  className="w-full h-14 rounded-2xl font-black text-base border-border hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                >
                  {isResettingPassword ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-5 w-5" />
                  )}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-primary p-8 text-primary-foreground relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full bg-white/10 blur-xl" />
             <div className="relative z-10 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                   <Settings2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-black tracking-tight">System Preferences</h3>
                   <p className="text-xs font-medium text-primary-foreground/70">Configure your workspace and notification settings.</p>
                </div>
                <Button variant="secondary" className="w-full h-12 rounded-xl font-bold bg-background text-primary hover:bg-background/90">
                   Open Preferences
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
