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
  FormMessage,
} from "@/components/ui/form";

interface ListingFormProps {
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_DIMENSION = 800;

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

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    try {
      setIsCompressing(true);
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: MAX_IMAGE_DIMENSION,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-[calc(100vh-2rem)] flex flex-col">
        {/* Header - keep fixed */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border/10 bg-background/95 backdrop-blur">
          <h2 className="text-lg font-semibold">Create Listing</h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-none">
          <div className="px-4 py-6 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input 
                      className="h-12 px-4 w-full cyber-panel neon-focus"
                      placeholder="Enter listing title"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      className="min-h-[120px] p-4 text-base w-full resize-none cyber-panel neon-focus"
                      placeholder="Enter listing description"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Price (π)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        className="h-12 px-4 w-full cyber-panel neon-focus"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(value >= 0 ? Math.min(value, 9999999.99) : 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 cyber-panel neon-focus">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        className="h-12 pl-10 pr-4 w-full cyber-panel neon-focus"
                        placeholder="Enter your location"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Image</FormLabel>
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
                        className="w-full h-12 cyber-panel neon-focus"
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
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Footer - keep fixed */}
        <div className="flex-shrink-0 p-4 border-t border-border/10 bg-background/95 backdrop-blur">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => generatePreviewQR(form.getValues())}
            >
              Generate QR Preview
            </Button>

            {previewQR && (
              <div className="py-3">
                <div className="flex justify-center">
                  <div className="w-[140px] h-[140px] bg-white rounded-lg p-2">
                    <QRCodeSVG
                      value={previewQR}
                      size={132}
                      level="H"
                      includeMargin={false}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || isCompressing}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Listing"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}