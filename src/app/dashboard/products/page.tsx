'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Package, Image, X, FolderOpen, ArrowLeft, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  reference?: string;
  description?: string;
  price?: number;
  image_url: string;
  imageUrl?: string; // For backwards compatibility
  createdAt?: string;
}

interface Catalog {
  id: string;
  name: string;
  description?: string;
  products: Product[];
  product_count?: number;
  createdAt?: string;
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Catalog | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [catalogName, setCatalogName] = useState('');
  const [catalogDescription, setCatalogDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [productReference, setProductReference] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'admin_master' || user?.role === 'admin_company' || user?.role === 'admin';

  useEffect(() => {
    if (user?.company_id) {
      loadCatalogs();
    }
  }, [user?.company_id]);

  const BACKEND_URL = 'http://talkagents.br.com/public_html/api_proxy.php';

  const loadCatalogs = async () => {
    if (!user?.company_id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}?path=catalogs&company_id=${user.company_id}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCatalogs(data.data);
      } else {
        setCatalogs([]);
      }
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Erro ao carregar catálogos');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogProducts = async (catalogId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}?path=catalogs&id=${catalogId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setSelectedCatalog(data.data);
      }
    } catch (error) {
      console.error('Error loading catalog products:', error);
      toast.error('Erro ao carregar produtos');
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
  const handleCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catalogName.trim()) {
      toast.error('Nome do catálogo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      if (editingCatalog) {
        const response = await fetch(`${BACKEND_URL}?path=catalogs&id=${editingCatalog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catalogName.trim(), description: catalogDescription.trim() })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Catálogo atualizado!');
          loadCatalogs();
        } else {
          toast.error(data.message || 'Erro ao atualizar catálogo');
        }
      } else {
        const response = await fetch(`${BACKEND_URL}?path=catalogs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            company_id: user?.company_id,
            name: catalogName.trim(),
            description: catalogDescription.trim()
          })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Catálogo criado!');
          loadCatalogs();
        } else {
          toast.error(data.message || 'Erro ao criar catálogo');
        }
      }
      resetCatalogForm();
    } catch (error) {
      console.error('Error saving catalog:', error);
      toast.error('Erro ao salvar catálogo');
    } finally {
      setSaving(false);
    }
  };

  const resetCatalogForm = () => {
    setCatalogName('');
    setCatalogDescription('');
    setEditingCatalog(null);
    setShowCatalogModal(false);
  };

  const handleEditCatalog = (catalog: Catalog) => {
    setEditingCatalog(catalog);
    setCatalogName(catalog.name);
    setCatalogDescription(catalog.description || '');
    setShowCatalogModal(true);
  };

  const handleDeleteCatalog = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este catálogo e todos os seus produtos?')) {
      try {
        const response = await fetch(`${BACKEND_URL}?path=catalogs&id=${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          if (selectedCatalog?.id === id) {
            setSelectedCatalog(null);
          }
          loadCatalogs();
          toast.success('Catálogo excluído!');
        } else {
          toast.error(data.message || 'Erro ao excluir catálogo');
        }
      } catch (error) {
        console.error('Error deleting catalog:', error);
        toast.error('Erro ao excluir catálogo');
      }
    }
  };

  // Product handlers
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productName.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    const imageUrl = imagePreview || editingProduct?.image_url || editingProduct?.imageUrl;
    if (!imageUrl) {
      toast.error('Imagem do produto é obrigatória');
      return;
    }

    if (!selectedCatalog) return;

    setSaving(true);
    try {
      if (editingProduct) {
        const response = await fetch(`${BACKEND_URL}?path=catalog-products&id=${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productName.trim(),
            reference: productReference.trim() || null,
            description: productDescription.trim() || null,
            price: productPrice ? parseFloat(productPrice) : null,
            image_url: imageUrl
          })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Produto atualizado!');
          loadCatalogProducts(selectedCatalog.id);
        } else {
          toast.error(data.message || 'Erro ao atualizar produto');
        }
      } else {
        const response = await fetch(`${BACKEND_URL}?path=catalog-products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            catalog_id: selectedCatalog.id,
            name: productName.trim(),
            reference: productReference.trim() || null,
            description: productDescription.trim() || null,
            price: productPrice ? parseFloat(productPrice) : null,
            image_url: imageUrl
          })
        });
        const data = await response.json();
        if (data.success) {
          toast.success('Produto cadastrado!');
          loadCatalogProducts(selectedCatalog.id);
        } else {
          toast.error(data.message || 'Erro ao criar produto');
        }
      }
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const resetProductForm = () => {
    setProductName('');
    setProductReference('');
    setProductDescription('');
    setProductPrice('');
    setImagePreview(null);
    setImageFile(null);
    setEditingProduct(null);
    setShowProductModal(false);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductReference(product.reference || '');
    setProductDescription(product.description || '');
    setProductPrice(product.price ? product.price.toString() : '');
    setImagePreview(product.image_url || product.imageUrl || null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!selectedCatalog) return;
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await fetch(`${BACKEND_URL}?path=catalog-products&id=${productId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          loadCatalogProducts(selectedCatalog.id);
          toast.success('Produto excluído!');
        } else {
          toast.error(data.message || 'Erro ao excluir produto');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Erro ao excluir produto');
      }
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
                  {(product.image_url || product.imageUrl) ? (
                    <img src={product.image_url || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
                    <input type="text" value={productReference} onChange={(e) => setProductReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900" placeholder="Ex: NFC-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                    <input type="number" step="0.01" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900" placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900" placeholder="Descrição do produto..." />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={resetProductForm} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? 'Salvando...' : (editingProduct ? 'Salvar' : 'Cadastrar')}</button>
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
            <div key={catalog.id} className="bg-white rounded-lg shadow overflow-hidden group cursor-pointer" onClick={() => loadCatalogProducts(catalog.id)}>
              <div className="aspect-video relative bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <FolderOpen className="w-16 h-16 text-white opacity-80" />
                {(catalog.product_count || 0) > 0 && (
                  <div className="absolute top-2 right-2 bg-white text-primary-600 text-xs font-bold px-2 py-1 rounded-full">
                    {catalog.product_count} {catalog.product_count === 1 ? 'produto' : 'produtos'}
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
                {catalog.createdAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Criado em {new Date(catalog.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
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
