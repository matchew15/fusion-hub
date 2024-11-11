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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Title</FormLabel>
                <FormControl>
                  <Input 
                    className="cyber-panel neon-focus" 
                    placeholder="Enter listing title"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    className="cyber-panel neon-focus min-h-[100px]" 
                    placeholder="Enter listing description"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Price (π)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    className="cyber-panel neon-focus"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Image URL</FormLabel>
                <FormControl>
                  <Input 
                    className="cyber-panel neon-focus" 
                    placeholder="Enter image URL"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full neon-border"
            onClick={() => generatePreviewQR(form.getValues())}
          >
            Generate QR Preview
          </Button>

          {previewQR && (
            <div className="flex justify-center p-4 bg-background/50 rounded-lg cyber-panel">
              <QRCodeSVG
                value={previewQR}
                size={200}
                level="H"
                includeMargin
                className="animate-in fade-in-50"
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full neon-border"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
