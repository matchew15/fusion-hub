import { useState, useEffect } from "react";
import { useNavigate } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Phone, UserCircle } from "lucide-react";
import type { User } from "db/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const updateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number").optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
});

type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      whatsappNumber: user?.whatsappNumber || "",
      avatar: user?.avatar || "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Calculate profile completion percentage
    let completed = 0;
    const totalFields = 4; // username, bio, whatsappNumber, avatar

    if (user.username) completed++;
    if (user.bio) completed++;
    if (user.whatsappNumber) completed++;
    if (user.avatar) completed++;

    setCompletionPercentage((completed / totalFields) * 100);
  }, [user, navigate]);

  const onSubmit = async (values: UpdateProfileSchema) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh user data
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Complete your profile to enhance your trading experience
            </p>
          </div>
          <div className="w-32">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground text-center mt-1">
              {Math.round(completionPercentage)}% Complete
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input {...field} className="pl-10 cyber-panel neon-focus" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Tell others about yourself..."
                      className="min-h-[100px] cyber-panel neon-focus" 
                    />
                  </FormControl>
                  <FormDescription>
                    Share a brief description about yourself (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="+1234567890"
                        className="pl-10 cyber-panel neon-focus"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your WhatsApp number for direct communication (e.g., +1234567890)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="https://example.com/avatar.jpg"
                        className="pl-10 cyber-panel neon-focus"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter a URL for your profile picture
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full neon-focus"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
