import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

interface FileUploadProps {
  attachments: FileAttachment[];
  onChange: (attachments: FileAttachment[]) => void;
  disabled?: boolean;
}

const FileUpload = ({ attachments, onChange, disabled }: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newAttachments: FileAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Ошибка',
            description: `Файл ${file.name} превышает 10MB`,
            variant: 'destructive',
          });
          continue;
        }

        const fileData: FileAttachment = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };

        newAttachments.push(fileData);
      }

      onChange([...attachments, ...newAttachments]);

      toast({
        title: 'Успешно!',
        description: `Добавлено файлов: ${newAttachments.length}`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файлы',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedAttachments = attachments.filter((file) => file.id !== fileId);
    onChange(updatedAttachments);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="gap-2"
        >
          <Icon name={uploading ? 'Loader2' : 'Paperclip'} size={16} className={uploading ? 'animate-spin' : ''} />
          {uploading ? 'Загрузка...' : 'Прикрепить файлы'}
        </Button>
        <span className="text-xs text-muted-foreground">До 10MB на файл</span>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name="FileText" size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveFile(file.id)}
                >
                  <Icon name="X" size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
