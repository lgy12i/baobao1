/**
 * 数据分析仪表板 · 霓虹深色主题
 *
 * 模块：
 *  1. 销售总览卡片（总销售额、订单数、客单价、今日数据）
 *  2. 近7天订单趋势图（柱状图 + 折线图）
 *  3. 商品热度排行 TOP10
 *  4. 分类销售占比
 *  5. 用户行为分析（消费漏斗 + 热门搜索词）
 */
import { useQuery } from 'react-query';
import {
  analyticsApi, SalesOverview, ProductRankingItem,
  OrderTrendItem, CategoryStat, UserBehavior
} from '@/services/analytics.api';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Package,
  BarChart3, PieChart, Activity, Star, Eye, ArrowUp, ArrowDown,
  Search, Crown, Zap, DollarSign
} from 'lucide-react';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'categories' | 'users'>('overview');

  const { data: overview } = useQuery('analytics-overview', () => analyticsApi.getSalesOverview());
  const { data: ranking } = useQuery('analytics-ranking', () => analyticsApi.getProductRanking(10));
  const { data: trend } = useQuery('analytics-trend', () => analyticsApi.getOrderTrend());
  const { data: categoryStats } = useQuery('analytics-category', () => analyticsApi.getCategoryStats());
  const { data: behavior } = useQuery('analytics-behavior', () => analyticsApi.getUserBehavior());

  const tabs = [
    { key: 'overview', label: '销售总览', icon: BarChart3 },
    { key: 'products', label: '商品排行', icon: Package },
    { key: 'orders', label: '订单趋势', icon: TrendingUp },
    { key: 'categories', label: '分类占比', icon: PieChart },
    { key: 'users', label: '用户行为', icon: Users }
  ];

  const formatNum = (n: number) => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toFixed(0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neon flex items-center gap-2">
          <BarChart3 size={24} /> 数据分析中心
        </h1>
        <span className="text-xs text-white/40">实时数据 · 每分钟刷新</span>
      </div>

      {/* Tab 切换 */}
      <div className="glass-card p-2 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all whitespace-nowrap " + (
              activeTab === tab.key
                ? 'bg-neon-gradient text-white shadow-neon-soft'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 销售总览 */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="总销售额"
              value={"¥" + formatNum(overview.totalSales)}
              icon={DollarSign}
              color="from-flame-500 to-primary-500"
              growth={overview.today.salesGrowth}
              subtitle={"今日 ¥" + formatNum(overview.today.sales)}
            />
            <MetricCard
              title="总订单数"
              value={formatNum(overview.totalOrders)}
              icon={ShoppingCart}
              color="from-primary-500 to-purple-500"
              growth={overview.today.orderGrowth}
              subtitle={"今日 " + overview.today.orders + " 单"}
            />
            <MetricCard
              title="客单价"
              value={"¥" + overview.avgOrderValue.toFixed(2)}
              icon={TrendingUp}
              color="from-neon-500 to-blue-500"
              subtitle={"已完成 " + overview.completedOrders + " 单"}
            />
            <MetricCard
              title="昨日销售额"
              value={"¥" + formatNum(overview.yesterday.sales)}
              icon={Activity}
              color="from-amber-500 to-flame-500"
              subtitle={"昨日 " + overview.yesterday.orders + " 单"}
            />
          </div>

          {/* 近7天趋势 */}
          {trend && (
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-neon-400" /> 近7天销售趋势
              </h3>
              <div className="flex items-end justify-between gap-2 h-48">
                {trend.trend.map((item, i) => {
                  const maxSales = Math.max(...trend.trend.map(t => t.sales), 1);
                  const heightPct = maxSales > 0 ? (item.sales / maxSales * 100) : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs text-white/60">¥{formatNum(item.sales)}</div>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-neon-500/30 to-neon-500/80 hover:from-neon-500/50 hover:to-neon-500 transition-all"
                          style={{ height: (heightPct > 5 ? heightPct : 5) + '%' }}
                        />
                      </div>
                      <div className="text-xs text-white/40">{item.date}</div>
                      <div className="text-[10px] text-white/30">周{item.weekday}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 订单状态分布 */}
          {trend && (
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold text-white mb-4">订单状态分布</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: '待付款', value: trend.statusDistribution.pending_payment, color: 'from-amber-500 to-yellow-500' },
                  { label: '待发货', value: trend.statusDistribution.pending_shipment, color: 'from-blue-500 to-cyan-500' },
                  { label: '待收货', value: trend.statusDistribution.pending_receipt, color: 'from-purple-500 to-violet-500' },
                  { label: '已完成', value: trend.statusDistribution.completed, color: 'from-emerald-500 to-neon-500' },
                  { label: '已取消', value: trend.statusDistribution.cancelled, color: 'from-red-500 to-rose-500' }
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={"w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br " + s.color + " flex items-center justify-center text-white font-bold text-lg mb-2"}>
                      {s.value}
                    </div>
                    <div className="text-xs text-white/50">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 商品排行 */}
      {activeTab === 'products' && ranking && (
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Crown size={20} className="text-amber-400" /> 商品热度排行 TOP{ranking.products.length}
          </h3>
          <div className="space-y-2">
            {ranking.products.map((p, i) => (
              <div key={p._id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <div className={"w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 " + (
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white' :
                  'bg-white/10 text-white/50'
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/80 truncate">{p.name}</div>
                  <div className="text-xs text-white/40">{p.brand} · {p.category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-flame-400 font-bold">¥{p.price}</div>
                  <div className="text-xs text-white/40">销量 {formatNum(p.salesCount)}</div>
                </div>
                <div className="hidden md:flex items-center gap-3 shrink-0">
                  <div className="text-center">
                    <Star size={14} className="text-amber-400 mx-auto" />
                    <div className="text-xs text-white/50">{p.rating.toFixed(1)}</div>
                  </div>
                  <div className="text-center">
                    <Zap size={14} className="text-neon-400 mx-auto" />
                    <div className="text-xs text-white/50">{p.conversionRate}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类占比 */}
      {activeTab === 'categories' && categoryStats && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart size={20} className="text-primary-400" /> 分类销售占比
            </h3>
            <div className="space-y-3">
              {categoryStats.categories.map((c, i) => {
                const colors = [
                  'from-flame-500 to-primary-500',
                  'from-primary-500 to-purple-500',
                  'from-neon-500 to-blue-500',
                  'from-amber-500 to-flame-500',
                  'from-emerald-500 to-neon-500',
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-cyan-500',
                  'from-rose-500 to-red-500'
                ];
                return (
                  <div key={c._id} className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{c.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/80">{c.name}</span>
                        <span className="text-xs text-white/50">{c.salesPercentage}% · ¥{formatNum(c.totalSales)}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={"h-full rounded-full bg-gradient-to-r " + colors[i % colors.length]}
                          style={{ width: c.salesPercentage + '%' }}
                        />
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px] text-white/40">
                        <span>商品 {c.productCount} 件</span>
                        <span>均价 ¥{c.avgPrice}</span>
                        <span>库存 {c.totalStock}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 用户行为 */}
      {activeTab === 'users' && behavior && (
        <div className="space-y-4">
          {/* 用户统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard title="总用户数" value={formatNum(behavior.userStats.totalUsers)} icon={Users} color="from-primary-500 to-purple-500" subtitle={"活跃 " + behavior.userStats.activeUsers} />
            <MetricCard title="新用户" value={formatNum(behavior.userStats.newUsers)} icon={User} color="from-neon-500 to-blue-500" subtitle="未下单" />
            <MetricCard title="重度用户" value={formatNum(behavior.userStats.userLevels.heavy)} icon={Crown} color="from-amber-500 to-flame-500" subtitle="10+订单" />
            <MetricCard title="人均订单" value={behavior.userStats.avgOrdersPerUser.toFixed(1)} icon={ShoppingCart} color="from-emerald-500 to-neon-500" subtitle="单/人" />
          </div>

          {/* 转化漏斗 */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-neon-400" /> 用户转化漏斗
            </h3>
            <div className="space-y-2">
              {[
                { label: '访问用户', value: behavior.funnel.visitors, color: 'from-blue-500 to-cyan-500', width: '100%' },
                { label: '浏览商品', value: behavior.funnel.productViews, color: 'from-primary-500 to-purple-500', width: (behavior.funnel.productViews / behavior.funnel.visitors * 100) + '%' },
                { label: '加入购物车', value: behavior.funnel.addToCart, color: 'from-purple-500 to-pink-500', width: (behavior.funnel.addToCart / behavior.funnel.visitors * 100) + '%' },
                { label: '进入结算', value: behavior.funnel.checkout, color: 'from-amber-500 to-flame-500', width: (behavior.funnel.checkout / behavior.funnel.visitors * 100) + '%' },
                { label: '完成购买', value: behavior.funnel.purchase, color: 'from-emerald-500 to-neon-500', width: (behavior.funnel.purchase / behavior.funnel.visitors * 100) + '%' }
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-white/60 text-right shrink-0">{f.label}</div>
                  <div className="flex-1">
                    <div className={"h-8 rounded-lg bg-gradient-to-r " + f.color + " flex items-center px-3"} style={{ width: f.width }}>
                      <span className="text-white text-sm font-medium">{formatNum(f.value)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-3 text-center">
                <span className="text-2xl font-bold text-neon">{behavior.funnel.conversionRate}%</span>
                <span className="text-sm text-white/50 ml-2">整体转化率</span>
              </div>
            </div>
          </div>

          {/* 热门搜索词 */}
          <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Search size={20} className="text-flame-400" /> 热门搜索关键词
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {behavior.hotKeywords.map((kw, i) => (
                <div key={i} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/80">{kw.keyword}</div>
                    <div className="text-xs text-white/40">{formatNum(kw.count)} 次搜索</div>
                  </div>
                  {kw.trend === 'up' && <ArrowUp size={16} className="text-emerald-400" />}
                  {kw.trend === 'down' && <ArrowDown size={16} className="text-red-400" />}
                  {kw.trend === 'stable' && <div className="w-4 h-0.5 bg-white/40"></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 指标卡片组件
function MetricCard({ title, value, icon: Icon, color, growth, subtitle }: {
  title: string;
  value: string;
  icon: any;
  color: string;
  growth?: number;
  subtitle?: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + color + " flex items-center justify-center text-white"}>
          <Icon size={20} />
        </div>
        {growth !== undefined && growth !== 0 && (
          <div className={"flex items-center gap-0.5 text-xs " + (growth >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {growth >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{subtitle || title}</div>
    </div>
  );
}
