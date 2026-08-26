/**
 * 页脚组件 · 霓虹主题
 */
import { Shield, Truck, RotateCcw, Headphones, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  const services = [
    { icon: Shield, title: '正品保障', desc: '品质保证' },
    { icon: Truck, title: '极速物流', desc: '闪电发货' },
    { icon: RotateCcw, title: '7天退换', desc: '无忧售后' },
    { icon: Headphones, title: 'AI客服', desc: '7×24h' }
  ];

  const links = [
    { title: '新手指南',   items: ['免费注册', '开店入驻', '支付方式', '联系客服'] },
    { title: '购物保障',   items: ['消费者保障', '先行赔付', '7天无理由', '正品保证'] },
    { title: '商家服务',   items: ['商家中心', '商家入驻', '运营中心', '商家培训'] },
    { title: '关于宝宝',   items: ['了解宝宝', '加入我们', '合作伙伴', '廉正举报'] }
  ];

  return (
    <footer className="mt-16 border-t border-white/5 bg-ink-950/60">
      {/* 服务保障 */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-b border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.title} className="flex items-center gap-3 glass-card p-4">
              <div className="w-11 h-11 rounded-xl bg-neon-gradient-soft flex items-center justify-center text-neon-300">
                <s.icon size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-white">{s.title}</h4>
                <p className="text-xs text-white/50">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 链接 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {links.map((sec) => (
            <div key={sec.title}>
              <h4 className="font-semibold text-white mb-3 text-sm">{sec.title}</h4>
              <ul className="space-y-2">
                {sec.items.map((it) => (
                  <li key={it}>
                    <a href="#" className="text-xs text-white/50 hover:text-neon-300 transition">{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">扫码下载</h4>
            <div className="w-28 h-28 glass rounded-xl flex flex-col items-center justify-center text-white/40 text-xs gap-1">
              <div className="w-16 h-16 border-2 border-white/20 rounded grid place-items-center text-neon-300 text-2xl">✦</div>
              APP 下载
            </div>
          </div>
        </div>
      </div>

      {/* 版权 */}
      <div className="border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© 2026 宝宝商城 Baobao Mall · 潮流霓虹购 · All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <a href="https://github.com/lgy12i/baobao" target="_blank" rel="noreferrer" className="hover:text-neon-300"><Github size={16} /></a>
            <a href="#" className="hover:text-neon-300"><Twitter size={16} /></a>
            <a href="#" className="hover:text-neon-300"><Mail size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
