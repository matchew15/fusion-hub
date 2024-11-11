import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Upload, X } from "lucide-react";
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

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Compressing image",
        description: "Please wait while we optimize your image...",
      });
      
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
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("image", base64String);
    };
    reader.readAsDataURL(file);
  };

  const generatePreviewQR = (values: any) => {
    const listingData = {
      title: values.title,
      description: values.description,
      price: values.price,
      type: values.type,
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
        className="flex flex-col w-full h-[85dvh] overflow-y-auto overscroll-none touch-pan-y px-4 sm:px-6 pb-6"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="flex-1 space-y-6 py-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Title</FormLabel>
                <FormControl>
                  <Input 
                    className="cyber-panel neon-focus h-12 px-4 w-full"
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
                <FormLabel className="text-base font-medium">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    className="cyber-panel neon-focus min-h-[120px] p-4 text-base w-full resize-y"
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
                  <FormLabel className="text-base font-medium">Price (π)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      className="cyber-panel neon-focus h-12 px-4 w-full"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(value >= 0 ? value : 0);
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
                  <FormLabel className="text-base font-medium">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="cyber-panel neon-focus h-12">
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
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Image</FormLabel>
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

        <div className="space-y-6 mt-auto pt-6 border-t border-border/10">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base neon-border"
            onClick={() => generatePreviewQR(form.getValues())}
          >
            Generate QR Preview
          </Button>

          {previewQR && (
            <div className="flex justify-center p-6 bg-background/50 rounded-lg cyber-panel">
              <div className="relative w-full max-w-[200px] aspect-square bg-white rounded-lg p-4">
                <QRCodeSVG
                  value={previewQR}
                  size={200}
                  level="H"
                  includeMargin={false}
                  className="w-full h-full animate-in fade-in-50"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base neon-border"
            disabled={isSubmitting || isCompressing}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Listing...
              </>
            ) : (
              "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
