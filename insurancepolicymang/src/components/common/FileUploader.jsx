import { useRef, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

/**
 * FileUploader — drag-and-drop + click-to-browse file uploader.
 *
 * Props:
 *   files    — array of File objects (controlled)
 *   onChange — callback receiving updated files array
 *   maxFiles — max number of files allowed (default 5)
 *   accept   — accepted MIME/extension string (default 'image/*,.pdf')
 */
export default function FileUploader({
  files = [],
  onChange,
  maxFiles = 5,
  accept = 'image/*,.pdf',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function mergeFiles(incoming) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
    const tooLarge = Array.from(incoming).filter((f) => f.size > MAX_SIZE);
    if (tooLarge.length > 0) {
      alert(`The following file(s) exceed the 5MB size limit:\n${tooLarge.map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)`).join('\n')}`);
    }

    const existingKeys = new Set(files.map((f) => `${f.name}__${f.size}`));
    const deduped = Array.from(incoming).filter(
      (f) => f.size <= MAX_SIZE && !existingKeys.has(`${f.name}__${f.size}`)
    );
    const merged = [...files, ...deduped].slice(0, maxFiles);
    onChange?.(merged);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    mergeFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleInputChange(e) {
    mergeFiles(e.target.files);
    e.target.value = '';
  }

  function removeFile(idx) {
    const updated = files.filter((_, i) => i !== idx);
    onChange?.(updated);
  }

  function getFileIcon(file) {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    return <FileText className="w-4 h-4 text-rose-500 shrink-0" />;
  }

  const canUploadMore = files.length < maxFiles;

  return (
    <div className="w-full space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => canUploadMore && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : canUploadMore
            ? 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer'
            : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={!canUploadMore}
        />

        {/* Icon */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-full ${
            isDragging ? 'bg-blue-100' : 'bg-white border border-slate-200'
          }`}
        >
          <Upload
            className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`}
          />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">
            {canUploadMore ? (
              <>
                <span className="text-blue-600 font-semibold">Drop files here</span>
                {' '}or{' '}
                <span className="text-blue-600 font-semibold">click to browse</span>
              </>
            ) : (
              <span className="text-slate-400">Maximum {maxFiles} files reached</span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Supported: Images &amp; PDF &nbsp;·&nbsp; Up to {maxFiles} files
          </p>
          {files.length > 0 && (
            <p className="mt-0.5 text-xs text-blue-500 font-medium">
              {files.length}/{maxFiles} uploaded
            </p>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-slate-200 shadow-sm"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
