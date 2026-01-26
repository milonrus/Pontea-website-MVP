import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { ImageParseItem } from '@/types';

interface BulkImageUploaderProps {
  images: ImageParseItem[];
  onImagesChange: (images: ImageParseItem[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const BulkImageUploader: React.FC<BulkImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 50,
  maxSizeMB = 5,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => crypto.randomUUID();

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return `${file.name}: Only PNG and JPG files are allowed`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `${file.name}: File exceeds ${maxSizeMB}MB limit`;
    }
    return null;
  };

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newErrors: string[] = [];

      // Check batch size limit
      const totalAfterAdd = images.length + fileArray.length;
      if (totalAfterAdd > maxImages) {
        newErrors.push(`Cannot add ${fileArray.length} images. Maximum is ${maxImages} (${images.length} already added).`);
        setErrors(newErrors);
        return;
      }

      const validFiles: File[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
      } else {
        setErrors([]);
      }

      if (validFiles.length === 0) return;

      // Read files and create ImageParseItems
      const newItems: ImageParseItem[] = await Promise.all(
        validFiles.map(async (file) => {
          const dataUrl = await readFileAsDataUrl(file);
          return {
            id: generateId(),
            file,
            dataUrl,
            status: 'pending' as const
          };
        })
      );

      onImagesChange([...images, ...newItems]);
    },
    [images, maxImages, maxSizeMB, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const { files } = e.dataTransfer;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [disabled, processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onImagesChange(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange]
  );

  const handleClearAll = useCallback(() => {
    onImagesChange([]);
    setErrors([]);
  }, [onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/10' : 'bg-gray-100'}`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="text-base font-medium text-gray-700">
              {isDragging ? 'Drop images here' : 'Drag and drop images here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse. PNG/JPG, max {maxSizeMB}MB each
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {images.length} / {maxImages} images selected
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-700">
                  {error}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Selected Images ({images.length})
            </h3>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700"
              disabled={disabled}
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((item) => (
              <div
                key={item.id}
                className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
              >
                <img
                  src={item.dataUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                  <p className="text-xs text-white truncate">{item.file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">No images selected yet</p>
        </div>
      )}
    </div>
  );
};

export default BulkImageUploader;
