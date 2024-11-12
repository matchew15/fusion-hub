import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Upload, X, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

interface ListingFormProps {
  onSuccess: () => void;
}

export default function ListingForm({ onSuccess }: ListingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      type: "Product",
      image: "",
      location: "",
    },
  });

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsCompressing(true);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue("image", base64String);
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error: any) {
      console.error("Image compression error:", error);
      toast({
        variant: "destructive",
        title: "Compression failed",
        description: "Please try a different image or reduce the image size manually.",
      });
      setIsCompressing(false);
    }
  };

  const generatePreviewQR = (values: any) => {
    const listingData = {
      title: values.title,
      description: values.description,
      price: values.price,
      type: values.type,
      location: values.location,
    };
    setPreviewQR(JSON.stringify(listingData));
  };

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create listing");
      }

      toast({
        title: "Success",
        description: "Listing created successfully",
      });
      onSuccess();
      form.reset();
      setPreviewQR(null);
      setImagePreview(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create listing",
      });
      console.error("Failed to create listing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="flex flex-col h-full bg-background/95 backdrop-blur"
      >
        {/* Header - keep fixed */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border/10 bg-background/95 backdrop-blur">
          <h2 className="text-lg font-semibold">Create Listing</h2>
        </div>

        {/* Scrollable content with padding bottom for keyboard */}
        <div className="flex-1 overflow-y-auto overscroll-none">
          <div className="p-4 space-y-4 pb-[60vh]">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} className="cyber-panel neon-focus" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px] cyber-panel neon-focus" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (π)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      className="cyber-panel neon-focus"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="cyber-panel neon-focus">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...field}
                        className="pl-10 cyber-panel neon-focus"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
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
                        className="w-full cyber-panel neon-focus"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressing}
                      >
                        {isCompressing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Optimizing Image...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      {imagePreview && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden cyber-panel">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImagePreview(null);
                              field.onChange("");
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Footer - keep fixed */}
        <div className="flex-shrink-0 p-4 border-t border-border/10 bg-background/95 backdrop-blur space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => generatePreviewQR(form.getValues())}
            className="w-full"
          >
            Generate QR Preview
          </Button>
          {previewQR && (
            <div className="flex justify-center py-2">
              <div className="w-32 h-32 bg-white rounded-lg p-2">
                <QRCodeSVG value={previewQR} size={112} level="H" />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
