'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import FileDownload from '@/components/FileDownload';
import InviteCode from '@/components/InviteCode';
import axios from 'axios';
import { FiCloud, FiActivity, FiShield } from 'react-icons/fi';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [port, setPort] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'download'>('upload');

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsUploading(true);
    setPort(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPort(response.data.port);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownload = async (port: number) => {
    setIsDownloading(true);
    
    try {
      const response = await axios.get(`/api/download/${port}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const headers = response.headers;
      let contentDisposition = '';
      
      for (const key in headers) {
        if (key.toLowerCase() === 'content-disposition') {
          contentDisposition = headers[key];
          break;
        }
      }
      
      let filename = 'downloaded-file';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please check the invite code and try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden py-12">
      
      {/* Background glowing blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[40rem] h-[40rem] rounded-full bg-blue-500/10 blur-[120px] animate-blob-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-purple-600/10 blur-[130px] animate-blob-2" />
        <div className="absolute top-[30%] right-[15%] w-[30rem] h-[30rem] rounded-full bg-indigo-500/8 blur-[100px] animate-blob-3" />
      </div>

      <div className="container mx-auto px-4 max-w-2xl relative z-10 flex-grow flex flex-col justify-center">
        <header className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 backdrop-blur-md">
            <FiShield className="text-violet-400 w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider uppercase text-violet-300">Fast & Private Transfer</span>
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-violet-400 bg-clip-text text-transparent">
              CloudShare
            </span>
          </h1>
          <p className="text-base text-white font-medium">
            Direct, secure, peer-to-peer file sharing via dynamic code gateways.
          </p>
        </header>
        
        <main className="glass-panel p-8">
          <div className="flex space-x-1 bg-white/5 p-1 rounded-xl mb-8 border border-white/5">
            <button
              className={`flex-1 py-3 px-4 text-center rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              Share a File
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'download'
                  ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('download')}
            >
              Receive a File
            </button>
          </div>
          
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              
              {uploadedFile && !isUploading && (
                <div className="glass-panel-light p-4 rounded-xl flex items-center justify-between border border-white/5 animate-pulse-slow">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                      <FiCloud className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold truncate text-white">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-100">{Math.round(uploadedFile.size / 1024)} KB</p>
                    </div>
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-400 rounded-full animate-spin"></div>
                    <FiActivity className="absolute text-violet-400 animate-pulse w-5 h-5" />
                  </div>
                  <p className="text-sm text-white font-medium">Encrypting & opening sharing port...</p>
                </div>
              )}
              
              <InviteCode port={port} />
            </div>
          ) : (
            <div>
              <FileDownload onDownload={handleDownload} isDownloading={isDownloading} />
              
              {isDownloading && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-400 rounded-full animate-spin"></div>
                    <FiCloud className="absolute text-blue-400 animate-pulse w-5 h-5" />
                  </div>
                  <p className="text-sm text-white font-medium">Connecting to peer and downloading...</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <footer className="mt-12 text-center text-slate-200 text-xs font-semibold tracking-wider uppercase relative z-10">
        <p>CloudShare &copy; {new Date().getFullYear()} &bull; Built for Krishna</p>
      </footer>
    </div>
  );
}
