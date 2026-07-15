'use client';
 
import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiLoader } from 'react-icons/fi';
import JSZip from 'jszip';
 
interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}
 
export default function FileUpload({ onFileUpload, isUploading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  // Custom directory tree recursive traverser supporting batch limit bypass (>100 files)
  const traverseFileTree = async (item: any, path: string = ""): Promise<{ file: File; path: string }[]> => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file: File) => {
          resolve([{ file, path: path + file.name }]);
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        
        const readAllEntries = async () => {
          let allEntries: any[] = [];
          const readBatch = (): Promise<any[]> => {
            return new Promise((resolveBatch) => {
              dirReader.readEntries((entries: any[]) => {
                resolveBatch(entries);
              });
            });
          };
          
          while (true) {
            const batch = await readBatch();
            if (batch.length === 0) break;
            allEntries = allEntries.concat(batch);
          }
          return allEntries;
        };
        
        readAllEntries().then(async (entries) => {
          const filePromises = entries.map(entry => traverseFileTree(entry, path + item.name + "/"));
          const filesArrays = await Promise.all(filePromises);
          resolve(filesArrays.flat());
        });
      } else {
        resolve([]);
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: any, event: any) => {
    const dragEvent = event as React.DragEvent;
    if (dragEvent && dragEvent.dataTransfer && dragEvent.dataTransfer.items) {
      const items = dragEvent.dataTransfer.items;
      if (items.length > 0) {
        // If there's only 1 dropped item and it's a file, upload directly as-is
        if (items.length === 1) {
          const entry = items[0].webkitGetAsEntry();
          if (entry && entry.isFile) {
            setIsZipping(true);
            try {
              const file: File = await new Promise((resolveFile) => {
                (entry as any).file((f: File) => resolveFile(f));
              });
              onFileUpload(file);
            } catch (err) {
              console.error('Error reading dropped file:', err);
            } finally {
              setIsZipping(false);
            }
            return;
          }
        }
        
        // Otherwise (multiple items or a directory), package them into a single ZIP archive
        setIsZipping(true);
        try {
          const zip = new JSZip();
          let hasFolder = false;
          let firstDirName = "";
          
          for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (!entry) continue;
            
            if (entry.isFile) {
              const file: File = await new Promise((resolveFile) => {
                (entry as any).file((f: File) => resolveFile(f));
              });
              zip.file(file.name, file);
            } else if (entry.isDirectory) {
              hasFolder = true;
              if (!firstDirName) firstDirName = entry.name;
              const filesList = await traverseFileTree(entry);
              for (const entryItem of filesList) {
                zip.file(entryItem.path, entryItem.file);
              }
            }
          }
          
          const content = await zip.generateAsync({ type: 'blob' });
          const zipName = hasFolder && items.length === 1 ? `${firstDirName}.zip` : 'shared_contents.zip';
          const zipFile = new File([content], zipName, {
            type: 'application/zip',
            lastModified: Date.now()
          });
          
          onFileUpload(zipFile);
        } catch (err) {
          console.error('Error zipping dropped items:', err);
          alert('Failed to package dropped items.');
        } finally {
          setIsZipping(false);
        }
        return;
      }
    }

    // Default fallback for file dialog clicks (change event)
    if (acceptedFiles.length > 0) {
      if (acceptedFiles.length === 1) {
        onFileUpload(acceptedFiles[0]);
      } else {
        setIsZipping(true);
        try {
          const zip = new JSZip();
          for (let i = 0; i < acceptedFiles.length; i++) {
            const file = acceptedFiles[i];
            zip.file(file.name, file);
          }
          const content = await zip.generateAsync({ type: 'blob' });
          const zipFile = new File([content], 'shared_files.zip', {
            type: 'application/zip',
            lastModified: Date.now()
          });
          onFileUpload(zipFile);
        } catch (err) {
          console.error('Error zipping selected files:', err);
          alert('Failed to package selected files.');
        } finally {
          setIsZipping(false);
        }
      }
    }
  }, [onFileUpload]);
  
  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop,
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
  });
 
  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
 
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      let folderName = 'Folder';
      const firstPath = files[0].webkitRelativePath;
      if (firstPath) {
        const parts = firstPath.split('/');
        if (parts.length > 0) {
          folderName = parts[0];
        }
      }
 
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = file.webkitRelativePath || file.name;
        zip.file(path, file);
      }
 
      const content = await zip.generateAsync({ type: 'blob' });
      const zipFile = new File([content], `${folderName}.zip`, {
        type: 'application/zip',
        lastModified: Date.now()
      });
 
      onFileUpload(zipFile);
    } catch (err) {
      console.error('Error zipping folder:', err);
      alert('Failed to compress folder before uploading.');
    } finally {
      setIsZipping(false);
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };
 
  return (
    <div className="space-y-5">
      <div 
        {...getRootProps()} 
        className={`
          w-full p-10 border border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 relative
          ${dragActive 
            ? 'border-violet-500 bg-violet-500/5 scale-[1.01] shadow-[0_0_20px_0_rgba(139,92,246,0.15)]' 
            : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]'
          }
          ${isUploading || isZipping ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isZipping ? (
            <>
              <div className="p-4 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400">
                <FiLoader className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">Compressing files...</p>
                <p className="text-sm text-slate-100">Packaging directories and items into ZIP format</p>
              </div>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-full border transition-all duration-300 ${dragActive ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-white/5 border-white/10 text-white'}`}>
                <FiUploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">Drag & drop files or folders here</p>
                <p className="text-sm text-slate-100">or click to browse local storage</p>
              </div>
              <p className="text-xs text-slate-200 font-medium">
                Files and directories are packaged and shared directly over secure gateways.
              </p>
            </>
          )}
        </div>
      </div>
 
      {!isZipping && (
        <div className="flex flex-col items-center justify-center">
          <input
            type="file"
            ref={folderInputRef}
            className="hidden"
            onChange={handleFolderChange}
            multiple
            {...({
              webkitdirectory: "true",
              directory: "true"
            } as any)}
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="w-full btn-primary py-3 flex items-center justify-center space-x-2 text-sm font-semibold transition-all duration-300"
            disabled={isUploading}
          >
            Select & Share a Folder
          </button>
        </div>
      )}
    </div>
  );
}
