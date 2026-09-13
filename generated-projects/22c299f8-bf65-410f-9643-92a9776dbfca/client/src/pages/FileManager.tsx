import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Database, 
  FileImage, 
  FileText, 
  Download, 
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  HardDrive,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  filepath: string;
  fileSize: number;
  mimeType: string;
  fileType: string;
  category: string;
  title?: string;
  description?: string;
  branchId?: string;
  uploadedBy: string;
  uploadSource: string;
  isActive: boolean;
  isPermanent: boolean;
  tags?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  categories: Record<string, number>;
}

export default function FileManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all files
  const { data: files = [], isLoading: filesLoading, refetch: refetchFiles } = useQuery<FileRecord[]>({
    queryKey: ['/api/files', { 
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      fileType: selectedFileType === 'all' ? undefined : selectedFileType,
      branchId: selectedBranch === 'all' ? undefined : selectedBranch,
      search: searchTerm || undefined
    }],
    enabled: false // We'll trigger this manually after indexing
  });

  // Fetch file statistics
  const { data: stats, isLoading: statsLoading } = useQuery<FileStats>({
    queryKey: ['/api/files/stats'],
    enabled: false // We'll trigger this manually after indexing
  });

  // Index all files mutation
  const indexFilesMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/files/index'),
    onSuccess: (data) => {
      console.log('Files indexed successfully:', data);
      // Refresh the files list and stats after indexing
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ['/api/files/stats'] });
    },
    onError: (error) => {
      console.error('Error indexing files:', error);
    }
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PATCH', `/api/files/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    }
  });

  // Auto-index files on component mount - disabled to prevent errors
  // useEffect(() => {
  //   indexFilesMutation.mutate();
  // }, []);

  // Filter files based on search and selections
  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (fileType === 'image') {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const handleViewFile = (file: FileRecord) => {
    // Open file in new tab
    window.open(file.filepath, '_blank');
  };

  const handleDownloadFile = (file: FileRecord) => {
    // Create download link
    const link = document.createElement('a');
    link.href = file.filepath;
    link.download = file.originalName;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="h-8 w-8" />
              File Manager
            </h1>
            <p className="text-slate-300 mt-2">
              Comprehensive database indexing and management of all uploaded files
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.location.href = '/admin-dashboard'}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              ← Back to Admin Dashboard
            </Button>
            
            <Button 
              onClick={() => indexFilesMutation.mutate()} 
              disabled={indexFilesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${indexFilesMutation.isPending ? 'animate-spin' : ''}`} />
              {indexFilesMutation.isPending ? 'Indexing...' : 'Re-index Files'}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Files</p>
                  <p className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.totalFiles || 0}
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Size</p>
                  <p className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : formatFileSize(stats?.totalSize || 0)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Images</p>
                  <p className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.fileTypes?.image || 0}
                  </p>
                </div>
                <FileImage className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Documents</p>
                  <p className="text-2xl font-bold text-white">
                    {statsLoading ? '...' : stats?.fileTypes?.document || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="unknown">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="system">System Files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Files ({filteredFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No files found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center space-x-4">
                      {getFileIcon(file.fileType, file.mimeType)}
                      <div>
                        <h3 className="text-white font-medium">{file.title || file.originalName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-400">
                          <span>{file.filename}</span>
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>{file.mimeType}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {file.uploadSource}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewFile(file)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFile(file)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFileMutation.mutate(file.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                        disabled={deleteFileMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}