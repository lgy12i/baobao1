/**
 * 用户中心页面
 */
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Heart, Settings, LogOut, Edit2, Plus, Trash2 } from 'lucide-react';

export default function UserCenterPage() {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div className="text-center py-12">请先登录</div>;
  }

  const tabs = [
    { key: 'profile', label: '个人资料', icon: User },
    { key: 'address', label: '收货地址', icon: MapPin },
    { key: 'favorites', label: '我的收藏', icon: Heart },
    { key: 'settings', label: '账号设置', icon: Settings }
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">会员中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧菜单 */}
        <aside className="bg-white rounded-lg p-4">
          {/* 用户信息卡片 */}
          <div className="text-center pb-4 border-b mb-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-3 flex items-center justify-center">
              <User size={32} className="text-primary-500" />
            </div>
            <h3 className="font-semibold">{user.nickname || user.username}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-50 text-primary-500 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
            
            <div className="border-t my-4" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
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
    gender: user?.gender || 'secret',
    phone: user?.phone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(form);
      alert('保存成功');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">个人资料</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 头像 */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-400" />
          </div>
          <button type="button" className="btn-outline">
            <Edit2 size={16} className="mr-1" />
            更换头像
          </button>
        </div>

        {/* 昵称 */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">昵称</label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            placeholder="请输入昵称"
            className="input-field max-w-md"
          />
        </div>

        {/* 性别 */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">性别</label>
          <div className="flex gap-4">
            {[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
              { value: 'secret', label: '保密' }
            ].map((option) => (
              <label
                key={option.value}
                className={`px-6 py-2 border rounded-lg cursor-pointer transition-all ${
                  form.gender === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
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
          <label className="block text-sm text-gray-600 mb-1">手机号</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="请输入手机号"
            className="input-field max-w-md"
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
  const { user } = useAuthStore();
  const addresses = user?.addresses || [];

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">收货地址</h2>
        <button className="btn-primary flex items-center gap-1">
          <Plus size={16} />
          新增地址
        </button>
      </div>

      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin size={48} className="mx-auto mb-4 text-gray-300" />
            <p>暂无收货地址</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div key={addr._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{addr.receiver}</span>
                    <span className="text-gray-500">{addr.phone}</span>
                    {addr.isDefault && (
                      <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-gray-600">
                    {addr.province} {addr.city} {addr.district} {addr.detail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-gray-500 hover:text-primary-500">
                    <Edit2 size={18} />
                  </button>
                  <button className="text-sm text-gray-500 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 收藏列表
 */
function FavoritesList() {
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">我的收藏</h2>
      <div className="text-center py-12 text-gray-500">
        <Heart size={48} className="mx-auto mb-4 text-gray-300" />
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
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-6">账号设置</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b">
          <div>
            <h3 className="font-medium">修改密码</h3>
            <p className="text-sm text-gray-500">定期修改密码可以提高账号安全性</p>
          </div>
          <button className="btn-outline">修改</button>
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <div>
            <h3 className="font-medium">消息通知</h3>
            <p className="text-sm text-gray-500">订单状态、促销活动等通知</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
          </label>
        </div>

        <div className="flex items-center justify-between py-4 border-b">
          <div>
            <h3 className="font-medium">隐私设置</h3>
            <p className="text-sm text-gray-500">管理您的隐私偏好</p>
          </div>
          <button className="btn-outline">设置</button>
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                logout();
                window.location.href = '/';
              }
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600"
          >
            <LogOut size={20} />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
