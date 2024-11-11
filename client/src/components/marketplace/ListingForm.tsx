import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertListingSchema } from "db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function ListingForm({ onSuccess }: ListingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewQR, setPreviewQR] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      image: "",
    },
  });

  const generatePreviewQR = (values: any) => {
    const listingData = {
      title: values.title,
      description: values.description,
      price: values.price,
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
        className="w-full max-w-2xl mx-auto space-y-8 px-4 sm:px-6 md:px-8"
      >
        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-base">Title</FormLabel>
                <FormControl>
                  <Input 
                    className="cyber-panel neon-focus h-12 sm:h-14 px-4"
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
                <FormLabel className="text-foreground text-base">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    className="cyber-panel neon-focus min-h-[120px] p-4 text-base"
                    placeholder="Enter listing description"
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-sm" />
              </FormItem>
            )}
          />

          <div className="grid sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground text-base">Price (π)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="cyber-panel neon-focus h-12 sm:h-14 px-4"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
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
                  <FormLabel className="text-foreground text-base">Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      className="cyber-panel neon-focus h-12 sm:h-14 px-4"
                      placeholder="Enter image URL"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 sm:h-14 text-base neon-border"
            onClick={() => generatePreviewQR(form.getValues())}
          >
            Generate QR Preview
          </Button>

          {previewQR && (
            <div className="flex justify-center p-4 sm:p-6 bg-background/50 rounded-lg cyber-panel">
              <div className="relative w-full max-w-[280px] aspect-square">
                <QRCodeSVG
                  value={previewQR}
                  size="100%"
                  level="H"
                  includeMargin
                  className="w-full h-full animate-in fade-in-50"
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 sm:h-14 text-base neon-border"
            disabled={isSubmitting}
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
