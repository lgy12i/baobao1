/**
 * 用户中心页面 · 霓虹深色主题
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi, CreateAddressParams } from '@/services/user.api';
import toast from 'react-hot-toast';
import { User, MapPin, Heart, Settings, LogOut, Edit2, Plus, Trash2, X, Check, Home } from 'lucide-react';

export default function UserCenterPage() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="text-center py-12 glass-card p-8">
        <User className="mx-auto mb-4 text-white/30" size={48} />
        <p className="text-white/50">请先登录</p>
      </div>
    );
  }

  const tabs = [
    { key: 'profile', label: '个人资料', icon: User },
    { key: 'address', label: '收货地址', icon: MapPin },
    { key: 'favorites', label: '我的收藏', icon: Heart },
    { key: 'settings', label: '账号设置', icon: Settings }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <h1 className="text-2xl font-bold text-neon flex items-center gap-2">
        <User className="text-primary-400" size={24} /> 会员中心
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧菜单 */}
        <aside className="glass-card p-4">
          {/* 用户信息卡片 */}
          <div className="text-center pb-4 border-b border-white/10 mb-4">
            <div className="w-20 h-20 bg-primary-500/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <User size={32} className="text-primary-400" />
            </div>
            <h3 className="font-semibold text-white">{user.nickname || user.username}</h3>
            <p className="text-sm text-white/50">{user.email}</p>
            <div className="mt-2">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full">
                VIP 会员
              </span>
            </div>
          </div>

          {/* 菜单列表 */}
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={"w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors " + (
                  activeTab === tab.key
                    ? 'bg-neon-500/10 text-neon-400 font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}

            <div className="border-t border-white/10 my-4" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={20} />
              退出登录
            </button>
          </nav>
        </aside>

        {/* 右侧内容 */}
        <main className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'address' && <AddressManagement />}
          {activeTab === 'favorites' && <FavoritesList />}
          {activeTab === 'settings' && <AccountSettings />}
        </main>
      </div>
    </div>
  );
}

/**
 * 个人资料设置
 */
function ProfileSettings() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    nickname: user?.nickname || '',
    gender: (user as any)?.gender || 'secret',
    phone: user?.phone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(form);
      toast.success('保存成功');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-6">个人资料</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 头像 */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
            <User size={32} className="text-white/30" />
          </div>
          <button type="button" className="btn-outline">
            <Edit2 size={16} className="mr-1" />
            更换头像
          </button>
        </div>

        {/* 昵称 */}
        <div>
          <label className="block text-sm text-white/70 mb-1">昵称</label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="请输入昵称"
            className="input-neon max-w-md"
          />
        </div>

        {/* 性别 */}
        <div>
          <label className="block text-sm text-white/70 mb-2">性别</label>
          <div className="flex gap-4">
            {[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'secret', label: '保密' }
            ].map((option) => (
              <label
                key={option.value}
                className={"px-6 py-2 border rounded-lg cursor-pointer transition-all " + (
                  form.gender === option.value
                    ? 'border-neon-500 bg-neon-500/10 text-neon-400'
                    : 'border-white/20 hover:border-white/30 text-white/60'
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={form.gender === option.value}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* 手机号 */}
        <div>
          <label className="block text-sm text-white/70 mb-1">手机号</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="请输入手机号"
            className="input-neon max-w-md"
          />
        </div>

        <button type="submit" className="btn-primary">
          保存修改
        </button>
      </form>
    </div>
  );
}

/**
 * 地址管理
 */
function AddressManagement() {
  const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuthStore();
  const addresses = user?.addresses || [];

  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressParams>({
    receiver: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false
  });

  const openAddModal = () => {
    setEditingAddress(null);
    setAddressForm({
      receiver: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    });
    setShowModal(true);
  };

  const openEditModal = (addr: any) => {
    setEditingAddress(addr);
    setAddressForm({
      receiver: addr.receiver,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      isDefault: addr.isDefault
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAddress(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressForm);
      } else {
        await addAddress(addressForm);
      }
      closeModal();
    } catch (error) {
      // 错误已在 store 层处理
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个地址吗？')) {
      try {
        await deleteAddress(id);
      } catch (error) {
        // 错误已在 store 层处理
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
    } catch (error) {
      // 错误已在 store 层处理
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="text-primary-400" size={20} />
          收货地址
        </h2>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-1"
        >
          <Plus size={16} />
          新增地址
        </button>
      </div>

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Home size={48} className="mx-auto mb-4 text-white/20" />
            <p>暂无收货地址，点击上方按钮添加</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr._id}
              className={"border rounded-xl p-4 transition-all " + (
                addr.isDefault
                  ? 'border-neon-500/40 bg-neon-500/5'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{addr.receiver}</span>
                    <span className="text-white/50 text-sm">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="badge-new">默认</span>
                    )}
                  </div>
                  <p className="mt-1 text-white/60 text-sm">
                    {addr.province} {addr.city} {addr.district} {addr.detail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs text-white/50 hover:text-neon-400 px-2 py-1 rounded transition-colors"
                      title="设为默认"
                    >
                      设为默认
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(addr)}
                    className="p-2 text-white/50 hover:text-neon-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="text-primary-400" size={20} />
                {editingAddress ? '编辑地址' : '添加新地址'}
              </h3>
              <button
                onClick={closeModal}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 收件人 */}
              <div>
                <label className="block text-sm text-white/70 mb-1">收件人</label>
                <input
                  type="text"
                  value={addressForm.receiver}
                  onChange={(e) => setAddressForm({ ...addressForm, receiver: e.target.value })}
                  placeholder="请输入收件人姓名"
                  className="input-neon"
                  required
                />
              </div>

              {/* 手机号 */}
              <div>
                <label className="block text-sm text-white/70 mb-1">手机号</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="input-neon"
                  required
                  maxLength={11}
                />
              </div>

              {/* 省市区 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">省</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="省"
                    className="input-neon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">市</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="市"
                    className="input-neon"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">区</label>
                  <input
                    type="text"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="区"
                    className="input-neon"
                    required
                  />
                </div>
              </div>

              {/* 详细地址 */}
              <div>
                <label className="block text-sm text-white/70 mb-1">详细地址</label>
                <textarea
                  value={addressForm.detail}
                  onChange={(e) => setAddressForm({ ...addressForm, detail: e.target.value })}
                  placeholder="请输入详细地址，如街道、门牌号等"
                  className="input-neon"
                  rows={3}
                  required
                />
              </div>

              {/* 是否默认 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="userCenterIsDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-neon-500 focus:ring-neon-500/50"
                />
                <label htmlFor="userCenterIsDefault" className="text-sm text-white/70 cursor-pointer">
                  设为默认地址
                </label>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white transition-all bg-neon-gradient hover:shadow-neon"
                >
                  {editingAddress ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 收藏列表
 */
function FavoritesList() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Heart className="text-flame-400" size={20} />
        我的收藏
      </h2>
      <div className="text-center py-12 text-white/40">
        <Heart size={48} className="mx-auto mb-4 text-white/20" />
        <p>暂无收藏商品</p>
      </div>
    </div>
  );
}

/**
 * 账号设置
 */
function AccountSettings() {
  const { logout } = useAuthStore();

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Settings className="text-primary-400" size={20} />
        账号设置
      </h2>

      <div className="space-y-2">
        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div>
            <h3 className="font-medium text-white">修改密码</h3>
            <p className="text-sm text-white/50">定期修改密码可以提高账号安全性</p>
          </div>
          <button className="btn-outline">修改</button>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div>
            <h3 className="font-medium text-white">消息通知</h3>
            <p className="text-sm text-white/50">订单状态、促销活动等通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-500" />
          </label>
        </div>

        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div>
            <h3 className="font-medium text-white">隐私设置</h3>
            <p className="text-sm text-white/50">管理您的隐私偏好</p>
          </div>
          <button className="btn-outline">设置</button>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              if (window.confirm('确定要退出登录吗？')) {
                logout();
                window.location.href = '/';
              }
            }}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}