import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, AlertCircle } from "lucide-react";

interface FileUploadProps {
  value: string[];
  onChange: (files: string[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}

export function FileUpload({ 
  value, 
  onChange, 
  maxFiles = 5,
  maxSizePerFile = 10 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      onChange([...value, ...data.urls]);
      toast({
        title: "Success",
        description: `${data.urls.length} file(s) uploaded successfully`,
      });
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
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (value.length + fileArray.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    // Validate file types and sizes
    const invalidFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= maxSizePerFile * 1024 * 1024;
      return !isValidType || !isValidSize;
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: `Only images under ${maxSizePerFile}MB are allowed`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          uploadMutation.isPending && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <div className="text-center">
          {uploadMutation.isPending ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload reference images
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                PNG, JPG up to {maxSizePerFile}MB
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Files ({value.length}/{maxFiles})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {value.map((url, index) => (
              <div
                key={index}
                className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-20 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Info */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-4 h-4 mr-1" />
        Maximum {maxFiles} files, {maxSizePerFile}MB each
      </div>
    </div>
  );
}
