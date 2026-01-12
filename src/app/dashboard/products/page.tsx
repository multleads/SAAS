'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Package, Image, X, FolderOpen, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

interface Catalog {
  id: string;
  name: string;
  products: Product[];
  createdAt: string;
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [productName, setProductName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin_master' || user?.role === 'admin_company' || user?.role === 'admin';

  useEffect(() => {
    loadCatalogs();
  }, [user?.company_id]);

  const loadCatalogs = () => {
    const stored = localStorage.getItem(`catalogs_${user?.company_id}`);
    if (stored) {
      setCatalogs(JSON.parse(stored));
    }
    setLoading(false);
  };

  const saveCatalogs = (newCatalogs: Catalog[]) => {
    localStorage.setItem(`catalogs_${user?.company_id}`, JSON.stringify(newCatalogs));
    setCatalogs(newCatalogs);
    // Update selectedCatalog if it exists
    if (selectedCatalog) {
      const updated = newCatalogs.find(c => c.id === selectedCatalog.id);
      setSelectedCatalog(updated || null);
    }
  };

  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        toast.error('Apenas imagens JPG ou PNG são permitidas');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 10MB');
        return;
      }
      
      setImageFile(file);
      const loadingToast = toast.loading('Comprimindo imagem...');
      
      try {
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        toast.dismiss(loadingToast);
        toast.success('Imagem carregada!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Erro ao processar imagem');
        console.error('Image compression error:', error);
      }
    }
  };

  // Catalog handlers
  const handleCatalogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catalogName.trim()) {
      toast.error('Nome do catálogo é obrigatório');
      return;
    }

    if (editingCatalog) {
      const newCatalogs = catalogs.map(c => 
        c.id === editingCatalog.id ? { ...c, name: catalogName.trim() } : c
      );
      saveCatalogs(newCatalogs);
      toast.success('Catálogo atualizado!');
    } else {
      const newCatalog: Catalog = {
        id: Date.now().toString(),
        name: catalogName.trim(),
        products: [],
        createdAt: new Date().toISOString()
      };
      saveCatalogs([...catalogs, newCatalog]);
      toast.success('Catálogo criado!');
    }
    resetCatalogForm();
  };

  const resetCatalogForm = () => {
    setCatalogName('');
    setEditingCatalog(null);
    setShowCatalogModal(false);
  };

  const handleEditCatalog = (catalog: Catalog) => {
    setEditingCatalog(catalog);
    setCatalogName(catalog.name);
    setShowCatalogModal(true);
  };

  const handleDeleteCatalog = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este catálogo e todos os seus produtos?')) {
      const newCatalogs = catalogs.filter(c => c.id !== id);
      saveCatalogs(newCatalogs);
      if (selectedCatalog?.id === id) {
        setSelectedCatalog(null);
      }
      toast.success('Catálogo excluído!');
    }
  };

  // Product handlers
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (!imagePreview && !editingProduct?.imageUrl) {
      toast.error('Imagem do produto é obrigatória');
      return;
    }

    if (!selectedCatalog) return;

    const newProduct: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: productName.trim(),
      imageUrl: imagePreview || editingProduct?.imageUrl || '',
      createdAt: editingProduct?.createdAt || new Date().toISOString()
    };

    const updatedCatalog = { ...selectedCatalog };
    if (editingProduct) {
      updatedCatalog.products = updatedCatalog.products.map(p => 
        p.id === editingProduct.id ? newProduct : p
      );
      toast.success('Produto atualizado!');
    } else {
      updatedCatalog.products = [...updatedCatalog.products, newProduct];
      toast.success('Produto cadastrado!');
    }

    const newCatalogs = catalogs.map(c => c.id === selectedCatalog.id ? updatedCatalog : c);
    saveCatalogs(newCatalogs);
    resetProductForm();
  };

  const resetProductForm = () => {
    setProductName('');
    setImagePreview(null);
    setImageFile(null);
    setEditingProduct(null);
    setShowProductModal(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setImagePreview(product.imageUrl);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!selectedCatalog) return;
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const updatedCatalog = {
        ...selectedCatalog,
        products: selectedCatalog.products.filter(p => p.id !== productId)
      };
      const newCatalogs = catalogs.map(c => c.id === selectedCatalog.id ? updatedCatalog : c);
      saveCatalogs(newCatalogs);
      toast.success('Produto excluído!');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acesso Restrito</h2>
          <p className="text-gray-500">Apenas administradores podem gerenciar produtos.</p>
        </div>
      </div>
    );
  }

  // Show products of selected catalog
  if (selectedCatalog) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedCatalog(null)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedCatalog.name}</h1>
              <p className="text-gray-600">{selectedCatalog.products.length} produtos</p>
            </div>
          </div>
          <button
            onClick={() => setShowProductModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Produto</span>
          </button>
        </div>

        {/* Products Grid */}
        {selectedCatalog.products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto neste catálogo</h3>
            <p className="text-gray-500 mb-4">Adicione produtos a este catálogo.</p>
            <button
              onClick={() => setShowProductModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Adicionar Produto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {selectedCatalog.products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden group">
                <div className="aspect-square relative bg-gray-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditProduct(product)} className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={resetProductForm} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto *</label>
                  <div className="flex flex-col items-center">
                    {imagePreview ? (
                      <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
                        <Image className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Clique para adicionar imagem</span>
                        <span className="text-xs text-gray-400 mt-1">JPG ou PNG, máx. 10MB</span>
                        <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900" placeholder="Ex: Etiqueta NFC Premium" />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={resetProductForm} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingProduct ? 'Salvar' : 'Cadastrar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show catalogs list
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogos de Produtos</h1>
          <p className="text-gray-600">Organize seus produtos em catálogos para envio aos clientes</p>
        </div>
        <button
          onClick={() => setShowCatalogModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Catálogo</span>
        </button>
      </div>

      {/* Catalogs Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : catalogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum catálogo criado</h3>
          <p className="text-gray-500 mb-4">Crie catálogos para organizar seus produtos.</p>
          <button
            onClick={() => setShowCatalogModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Criar Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="bg-white rounded-lg shadow overflow-hidden group cursor-pointer" onClick={() => setSelectedCatalog(catalog)}>
              <div className="aspect-video relative bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <FolderOpen className="w-16 h-16 text-white opacity-80" />
                {catalog.products.length > 0 && (
                  <div className="absolute top-2 right-2 bg-white text-primary-600 text-xs font-bold px-2 py-1 rounded-full">
                    {catalog.products.length} {catalog.products.length === 1 ? 'produto' : 'produtos'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEditCatalog(catalog)} className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteCatalog(catalog.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{catalog.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Criado em {new Date(catalog.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCatalog ? 'Editar Catálogo' : 'Novo Catálogo'}
              </h2>
              <button onClick={resetCatalogForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCatalogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Catálogo *</label>
                <input type="text" value={catalogName} onChange={(e) => setCatalogName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900" placeholder="Ex: Etiquetas NFC, QR Codes, etc." />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={resetCatalogForm} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingCatalog ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
