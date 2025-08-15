import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertArtistSchema, type InsertArtist, type Artist } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  artist?: Artist;
}

const commonSpecialties = [
  "Traditional", "Realism", "Neo-Traditional", "Blackwork", "Dotwork",
  "Watercolor", "Geometric", "Tribal", "Portraits", "Lettering",
  "Japanese", "Biomechanical", "Abstract", "Fine Line", "Color Work"
];

export function ArtistModal({ isOpen, onClose, artist }: ArtistModalProps) {
  const [specialties, setSpecialties] = useState<string[]>(artist?.specialties || []);
  const [newSpecialty, setNewSpecialty] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!artist;

  const form = useForm<InsertArtist>({
    resolver: zodResolver(insertArtistSchema),
    defaultValues: {
      userId: artist?.userId || undefined,
      name: artist?.name || "",
      email: artist?.email || "",
      phone: artist?.phone || "",
      specialties: artist?.specialties || [],
      schedule: artist?.schedule || "",
      hourlyRate: artist?.hourlyRate || undefined,
      isActive: artist?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertArtist) => {
      const payload = { ...data, specialties };
      if (isEditing) {
        await apiRequest("PATCH", `/api/artists/${artist.id}`, payload);
      } else {
        await apiRequest("POST", "/api/artists", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: `Artist ${isEditing ? 'updated' : 'created'} successfully`,
      });
      onClose();
      form.reset();
      setSpecialties([]);
      setNewSpecialty("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} artist`,
        variant: "destructive",
      });
    },
  });

  const addSpecialty = (specialty: string) => {
    if (specialty && !specialties.includes(specialty)) {
      setSpecialties([...specialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter(s => s !== specialty));
  };

  const handleAddCustomSpecialty = () => {
    if (newSpecialty.trim()) {
      addSpecialty(newSpecialty.trim());
      setNewSpecialty("");
    }
  };

  const onSubmit = (data: InsertArtist) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Artist' : 'Add New Artist'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Artist is currently working
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="schedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Mon-Fri 9AM-6PM" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specialties */}
            <div className="space-y-3">
              <FormLabel>Specialties</FormLabel>
              
              {/* Selected Specialties */}
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="pr-1">
                      {specialty}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeSpecialty(specialty)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Common Specialties */}
              <div className="flex flex-wrap gap-2">
                {commonSpecialties.filter(s => !specialties.includes(s)).map((specialty) => (
                  <Button
                    key={specialty}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecialty(specialty)}
                  >
                    + {specialty}
                  </Button>
                ))}
              </div>

              {/* Custom Specialty Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom specialty..."
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSpecialty())}
                />
                <Button type="button" variant="outline" onClick={handleAddCustomSpecialty}>
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Artist" : "Create Artist")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
