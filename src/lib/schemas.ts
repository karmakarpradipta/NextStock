import * as z from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  remember: z.boolean().default(false).optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["ADMIN", "STAFF"], {
    message: "Please select a role.",
  }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const createUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["ADMIN", "STAFF"], {
    message: "Please select a role.",
  }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }).optional(),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const categorySchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters." }),
  isActive: z.boolean(),
});

export const vendorSchema = z.object({
  name: z.string().min(2, { message: "Vendor name must be at least 2 characters." }),
  contactPerson: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  sku: z.string().min(3, { message: "SKU is required." }),
  description: z.string().optional(),
  minStockThreshold: z.number().min(0, { message: "Threshold must be at least 0." }),
  unit: z.string().min(1, { message: "Please select a unit." }),
  categoryId: z.string().min(1, { message: "Please select a category." }),
  isActive: z.boolean(),
  imageUrl: z.string().optional(),
});

export const purchaseSchema = z.object({
  vendorId: z.string().min(1, { message: "Please select a vendor." }),
  purchaseDate: z.string().optional(),
  expectedDelivery: z.string().optional(),
  invoiceUrl: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, { message: "Product is required." }),
    quantity: z.number().min(1, { message: "Qty min 1." }),
    unitPrice: z.number().min(0, { message: "Price min 0." }),
  })).min(1, { message: "Add at least one item." }),
});

export const salesSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email({ message: "Invalid email." }).optional().or(z.literal("")),
  saleDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, { message: "Product is required." }),
    quantity: z.number().min(1, { message: "Qty min 1." }),
    unitPrice: z.number().min(0, { message: "Price min 0." }),
  })).min(1, { message: "Add at least one item." }),
});

export type CategoryValues = z.infer<typeof categorySchema>;
export type VendorValues = z.infer<typeof vendorSchema>;
export type ProductValues = z.infer<typeof productSchema>;
export type PurchaseValues = z.infer<typeof purchaseSchema>;
export type SalesValues = z.infer<typeof salesSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
