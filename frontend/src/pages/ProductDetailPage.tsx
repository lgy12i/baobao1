/**
 * 商品详情页
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useState } from 'react';
import { productApi } from '@/services/product.api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { 
  Minus, 
  Plus, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSku, setSelectedSku] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});

  const { data: product, isLoading } = useQuery(
    ['product', id],
    () => productApi.getProductById(id!)
  );

  // 规格选择处理
  const handleSpecSelect = (specName: string, value: string) => {
    setSelectedSpecs(prev => ({ ...prev, [specName]: value }));
    
    // 找到匹配的 SKU
    if (product) {
      const skuIndex = product.skus.findIndex(sku => {
        return sku.specCombination.every(spec => 
          selectedSpecs[spec.name] === spec.value || 
          (spec.name === specName && spec.value === value)
        );
      });
      if (skuIndex !== -1) {
        setSelectedSku(skuIndex);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (!product) return;

    // 验证是否选择了所有规格
    if (product.specs && product.specs.length > 0) {
      const allSelected = product.specs.every(spec => selectedSpecs[spec.name]);
      if (!allSelected) {
        toast.error('请选择完整的商品规格');
        return;
      }
    }

    try {
      await addItem(product._id, product.skus[selectedSku].skuCode, quantity);
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (!product) return;

    // 先添加到购物车，然后跳转结算
    try {
      await addItem(product._id, product.skus[selectedSku].skuCode, quantity);
      navigate('/checkout');
    } catch (error) {
      // 错误已在 API 层处理
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">商品不存在</p>
        <button onClick={() => navigate('/')} className="mt-4 btn-primary">返回首页</button>
      </div>
    );
  }

  const currentSku = product.skus[selectedSku];

  return (
    <div className="animate-fade-in">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <ChevronLeft className="cursor-pointer hover:text-primary-500" onClick={() => navigate(-1)} />
        <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary-500">首页</span>
        <span>/</span>
        <span onClick={() => navigate(`/products?categoryId=${product.categoryId._id}`)} className="cursor-pointer hover:text-primary-500">
          {product.categoryId.name}
        </span>
        <span>/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 商品图片 */}
        <div className="flex gap-4">
          {/* 缩略图 */}
          <div className="flex flex-col gap-2">
            {product.images.map((img, index) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
                }`}
                onMouseEnter={() => setSelectedImage(index)}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          
          {/* 主图 */}
          <div className="flex-1">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 商品信息 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {product.name}
          </h1>
          <p className="text-gray-500 mb-4">{product.description}</p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags?.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-primary-50 text-primary-500 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* 价格 */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500">价格</span>
              <span className="text-3xl font-bold text-primary-500">
                ¥{currentSku?.price || product.price}
              </span>
              {product.originalPrice && product.originalPrice > (currentSku?.price || product.price) && (
                <span className="text-lg text-gray-400 line-through">
                  ¥{product.originalPrice}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>已售 {product.salesCount}</span>
              <span>库存 {currentSku?.stock || '充足'}</span>
            </div>
          </div>

          {/* 促销信息 */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-16">促销</span>
              <span className="text-primary-500">满99元包邮</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-16">配送</span>
              <span>发货至：浙江 杭州 西湖区</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-16">服务</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1"><Truck size={14} />极速物流</span>
                <span className="flex items-center gap-1"><Shield size={14} />正品保障</span>
                <span className="flex items-center gap-1"><RotateCcw size={14} />7天退换</span>
              </div>
            </div>
          </div>

          {/* 规格选择 */}
          {product.specs?.map((spec) => (
            <div key={spec.name} className="mb-4">
              <div className="flex items-center gap-4">
                <span className="text-gray-500 w-16">{spec.name}</span>
                <div className="flex flex-wrap gap-2">
                  {spec.values.map((value) => (
                    <button
                      key={value}
                      className={`px-4 py-2 border rounded-lg transition-all ${
                        selectedSpecs[spec.name] === value
                          ? 'border-primary-500 text-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleSpecSelect(spec.name, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* 数量选择 */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-gray-500 w-16">数量</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus size={18} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className="w-16 text-center border-l border-r border-gray-300 py-2 focus:outline-none"
              />
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
              >
                <Plus size={18} />
              </button>
            </div>
            <span className="text-gray-400 text-sm">库存 {currentSku?.stock}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <ShoppingCart size={20} />
              加入购物车
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              立即购买
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-500 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
