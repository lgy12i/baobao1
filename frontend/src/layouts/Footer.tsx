/**
 * 页脚组件
 */
import { Shield, Truck, RotateCcw, Headphones } from 'lucide-react';

export default function Footer() {
  const services = [
    { icon: Shield, title: '正品保障', desc: '品质保证' },
    { icon: Truck, title: '极速物流', desc: '闪电发货' },
    { icon: RotateCcw, title: '7天退换', desc: '无忧售后' },
    { icon: Headphones, title: '24h客服', desc: '贴心服务' }
  ];

  const links = [
    {
      title: '新手指南',
      items: ['免费注册', '开店入驻', '支付方式', '联系客服']
    },
    {
      title: '购物保障',
      items: ['消费者保障', '先行赔付', '7天无理由', '正品保证']
    },
    {
      title: '商家服务',
      items: ['商家中心', '商家入驻', '运营中心', '商家培训']
    },
    {
      title: '关于宝宝',
      items: ['了解宝宝', '加入我们', '合作伙伴', '廉正举报']
    }
  ];

  return (
    <footer className="bg-white border-t mt-12">
      {/* 服务保障 */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {services.map((service) => (
            <div key={service.title} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-500">
                <service.icon size={24} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{service.title}</h4>
                <p className="text-sm text-gray-500">{service.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 链接区域 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {links.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-gray-800 mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">客户端下载</h4>
            <div className="space-y-3">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                二维码
              </div>
              <p className="text-xs text-gray-500">扫码下载APP</p>
            </div>
          </div>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="bg-gray-800 text-gray-400 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>© 2026 宝宝商城 Baobao Mall. All Rights Reserved.</p>
          <p className="mt-1">
            <a href="#" className="hover:text-white">关于我们</a> | 
            <a href="#" className="hover:text-white mx-2">服务条款</a> | 
            <a href="#" className="hover:text-white">隐私政策</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
