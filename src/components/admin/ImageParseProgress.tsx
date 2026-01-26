import React from 'react';
import { ImageParseItem } from '@/types';
import { CheckCircle, XCircle, Loader2, Clock, RefreshCw } from 'lucide-react';
import Button from '@/components/shared/Button';

interface ImageParseProgressProps {
  images: ImageParseItem[];
  onRetryFailed: () => void;
  isParsing: boolean;
}

const ImageParseProgress: React.FC<ImageParseProgressProps> = ({
  images,
  onRetryFailed,
  isParsing
}) => {
  const pending = images.filter((img) => img.status === 'pending').length;
  const parsing = images.filter((img) => img.status === 'parsing').length;
  const success = images.filter((img) => img.status === 'success').length;
  const error = images.filter((img) => img.status === 'error').length;
  const completed = success + error;
  const total = images.length;

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getStatusIcon = (status: ImageParseItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'parsing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBg = (status: ImageParseItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100';
      case 'parsing':
        return 'bg-primary/10 ring-2 ring-primary/30';
      case 'success':
        return 'bg-green-50 ring-1 ring-green-200';
      case 'error':
        return 'bg-red-50 ring-1 ring-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isParsing ? (
              <>Parsing {parsing + completed} of {total} images...</>
            ) : completed === total ? (
              <>Parsing Complete</>
            ) : (
              <>Ready to Parse</>
            )}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" /> {success}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" /> {error}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="absolute right-0 -top-6 text-sm text-gray-500">
            {progressPercent}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm text-gray-600">
          <span>Pending: {pending}</span>
          <span>Processing: {parsing}</span>
          <span>Completed: {completed}</span>
        </div>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {images.map((item) => (
          <div
            key={item.id}
            className={`relative aspect-square rounded-lg overflow-hidden ${getStatusBg(item.status)}`}
          >
            <img
              src={item.dataUrl}
              alt={item.file.name}
              className={`w-full h-full object-cover ${
                item.status === 'error' ? 'opacity-50' : ''
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-2 bg-white/90 rounded-full shadow-sm">
                {getStatusIcon(item.status)}
              </div>
            </div>
            {item.error && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 px-2 py-1">
                <p className="text-xs text-white truncate" title={item.error}>
                  {item.error}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Retry button */}
      {error > 0 && !isParsing && (
        <div className="flex justify-center">
          <Button
            onClick={onRetryFailed}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry {error} Failed Image{error > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageParseProgress;
