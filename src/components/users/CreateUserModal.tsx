import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateUserMutation } from "../../features/auth/usersApiSlice";
import { createUserSchema, type CreateUserValues } from "../../lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { PasswordGenerator } from "./PasswordGenerator";

export function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createUser, { isLoading }] = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STAFF",
    },
  });

  const onSubmit = async (data: CreateUserValues) => {
    try {
      await createUser(data).unwrap();
      toast.success("User created successfully");
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system and assign their role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role" className="w-full cursor-pointer">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="STAFF" className="cursor-pointer">Staff</SelectItem>
                    <SelectItem value="ADMIN" className="cursor-pointer">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-xs font-medium text-destructive">{errors.role.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
            )}
          </div>

          <PasswordGenerator onGenerate={(pass) => setValue("password", pass, { shouldValidate: true })} />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
