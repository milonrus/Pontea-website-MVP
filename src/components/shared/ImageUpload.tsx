import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string | null) => void;
  folder?: string;
  label?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentUrl,
  onUpload,
  folder = 'questions',
  label = 'Image'
}) => {
  const bucketName = 'questions';
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStoragePath = (url: string) => {
    try {
      const parsed = new URL(url);
      const marker = '/storage/v1/object/public/';
      const index = parsed.pathname.indexOf(marker);
      if (index === -1) return null;
      const path = parsed.pathname.slice(index + marker.length);
      const [bucket, ...rest] = path.split('/');
      if (bucket !== bucketName) return null;
      return rest.join('/');
    } catch (err) {
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase
        .storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const url = publicUrlData.publicUrl;

      // Delete old image if exists
      if (currentUrl) {
        try {
          const oldPath = getStoragePath(currentUrl);
          if (oldPath) {
            await supabase.storage.from(bucketName).remove([oldPath]);
          }
        } catch (err) {
          // Ignore errors deleting old file
          console.warn('Could not delete old image:', err);
        }
      }

      onUpload(url);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;

    try {
      const imagePath = getStoragePath(currentUrl);
      if (imagePath) {
        await supabase.storage.from(bucketName).remove([imagePath]);
      }
    } catch (err) {
      console.warn('Could not delete image:', err);
    }

    onUpload(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt="Uploaded"
            className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            uploading
              ? 'border-primary/50 bg-primary/5'
              : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
