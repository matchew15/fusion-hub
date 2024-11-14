import { useUser } from "@/hooks/use-user";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Star } from "lucide-react";
import TransactionHistory from "@/components/TransactionHistory";
import imageCompression from "browser-image-compression";
import { insertUserSchema } from "db/schema";
import type { User } from "db/schema";

export default function Profile() {
  const { user, mutate: mutateUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      whatsappNumber: user?.whatsappNumber || "",
      avatar: user?.avatar || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        bio: user.bio || "",
        whatsappNumber: user.whatsappNumber || "",
        avatar: user.avatar || "",
      });
    }
  }, [user, form]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsCompressing(true);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("avatar", base64String);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      console.error("Image compression error:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Please try a different image or reduce the image size manually.",
      });
      setIsCompressing(false);
    }
  };

  const onSubmit = async (values: Partial<User>) => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      mutateUser(updatedUser);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold glow-text">Profile</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="cyber-panel space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={form.watch("avatar")} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            
            <Button
              type="button"
              variant="outline"
              className="neon-focus"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing}
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Change Avatar
                </>
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{user.rating}</span>
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register("username")}
                className="cyber-panel neon-focus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                className="cyber-panel neon-focus min-h-[100px]"
                placeholder="Tell others about yourself..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                {...form.register("whatsappNumber")}
                className="cyber-panel neon-focus"
                placeholder="+1234567890"
              />
            </div>

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
                'Update Profile'
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
