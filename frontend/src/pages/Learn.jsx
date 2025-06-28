import React, { useState, useMemo } from 'react';
import { 
  BarChart2 as ChartBar, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw as Repeat, 
  Clock, 
  PieChart, 
  Calculator,
  Search,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

// Perfect Trading Metrics Guide Component
// Enhanced visual design while preserving exact content and functionality

const TradingMetricsGuide = () => {
  // State for language, search and filtering
  const [lang, setLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Metric definitions (English + Arabic)
  const sections = [
    {
      id: 1,
      title_en: 'Summary Metrics',
      title_ar: 'المقاييس المُلخّصة',
      color: 'from-blue-500 to-indigo-600',
      icon: ChartBar,
      items: [
        {
          key: 'total_trades',
          label_en: 'Total Trades',
          label_ar: 'إجمالي الصفقات',
          desc_en:
            'The total number of trades executed (both winners and losers). Why it matters: gives a sense of sample size—more trades generally lead to more statistically reliable metrics.',
          desc_ar:
            'هو إجمالي عدد الصفقات المُنفذة (الفائزة والخاسرة معاً). لماذا يهم: لأنه يعطيك فكرة عن حجم العينة—كلما زاد عدد الصفقات، ارتفعت موثوقية النتائج الإحصائية.',
          importance: 'high'
        },
        {
          key: 'total_net_pnl',
          label_en: 'Total Net P&L',
          label_ar: 'إجمالي الربح/الخسارة الصافية',
          desc_en:
            'The sum of profit and loss across all trades (in account currency). Why it matters: shows your overall profitability (or loss) during the backtest/journal period.',
          desc_ar:
            'مجموع الربح والخسارة لجميع الصفقات (بالعملة المحلية للحساب). لماذا يهم: يُظهر مدى ربحيتك أو خسارتك الإجمالية خلال فترة الاسترجاع أو التسجيل.',
          importance: 'critical'
        },
        {
          key: 'avg_pnl_per_trade',
          label_en: 'Average P&L per Trade',
          label_ar: 'متوسط الربح/الخسارة لكل صفقة',
          desc_en:
            "Total Net P&L divided by Total Trades. Why it matters: indicates on average how much you're making or losing per position.",
          desc_ar:
            'إجمالي الربح/الخسارة الصافية مقسومًا على إجمالي عدد الصفقات. لماذا يهم: يبين في المتوسط مقدار الربح أو الخسارة لكل صفقة.',
          importance: 'high'
        },
        {
          key: 'win_rate',
          label_en: 'Win Rate (%)',
          label_ar: 'نسبة الفوز (%)',
          desc_en:
            '(Number of winning trades ÷ Total Trades) × 100. Why it matters: shows the fraction of trades closed for a profit. A high win rate can be offset by poor risk‐reward, so it must be viewed alongside average wins/losses.',
          desc_ar:
            '(عدد الصفقات الرابحة ÷ إجمالي الصفقات) × 100. لماذا يهم: يوضح نسبة الصفقات التي حققت ربحًا. قد تكون نسبة الفوز عالية رغم أن المخاطرة/العائد ضعيف، لذا يجب النظر إليه جنبًا إلى جنب مع متوسط الربح/الخسارة.',
          importance: 'critical'
        },
        {
          key: 'loss_rate',
          label_en: 'Loss Rate (%)',
          label_ar: 'نسبة الخسارة (%)',
          desc_en:
            "(Number of losing trades ÷ Total Trades) × 100 (or simply 100 – Win Rate). Why it matters: clarifies how often you're losing; complements the win rate.",
          desc_ar:
            '(عدد الصفقات الخاسرة ÷ إجمالي الصفقات) × 100 (أو ببساطة 100 – نسبة الفوز). لماذا يهم: يوضح كم مرة تخسر؛ يُكمل نسبة الفوز.',
          importance: 'high'
        },
      ],
    },
    {
      id: 2,
      title_en: 'Risk-Reward & Trade-Level Metrics',
      title_ar: 'مقاييس الخطر/العائد ومقاييس كل صفقة',
      color: 'from-purple-500 to-pink-600',
      icon: Scale,
      items: [
        {
          key: 'avg_win',
          label_en: 'Average Win',
          label_ar: 'متوسط الربح',
          desc_en:
            'The mean profit of all winning trades. Why it matters: indicates how large winners tend to be.',
          desc_ar:
            'المتوسط الحسابي لأرباح جميع الصفقات الرابحة. لماذا يهم: يُظهر حجم الأرباح النموذجية للصفقات الفائزة.',
          importance: 'high'
        },
        {
          key: 'avg_loss',
          label_en: 'Average Loss',
          label_ar: 'متوسط الخسارة',
          desc_en:
            'The mean loss of all losing trades (usually expressed as a positive number or negative). Why it matters: shows how large your typical losers are.',
          desc_ar:
            'المتوسط الحسابي لخسائر جميع الصفقات الخاسرة (يُعبر عنه عادةً كرقم موجب أو سالب). لماذا يهم: يُظهر حجم خسائرك النموذجية.',
          importance: 'high'
        },
        {
          key: 'avg_win_loss_ratio',
          label_en: 'Average Win/Loss Ratio (R:R)',
          label_ar: 'متوسط نسبة الربح إلى الخسارة (R:R)',
          desc_en:
            '(Average Win) ÷ (Average Loss). Why it matters: measures whether your winners are bigger than your losers on average. For example, a 2:1 ratio means your winners are twice as large as your losers.',
          desc_ar:
            '(متوسط الربح) ÷ (متوسط الخسارة). لماذا يهم: يقيس ما إذا كانت أرباحك أكبر من خسائرك في المتوسط. على سبيل المثال، النسبة 2:1 تعني أن أرباحك ضعف خسائرك.',
          importance: 'critical'
        },
        {
          key: 'r_multiple_distribution',
          label_en: 'R-Multiple Distribution',
          label_ar: 'توزيع مضاعف R',
          desc_en:
            'For each trade, R is defined as (profit or loss) ÷ (risk taken). R-Multiple Histogram: shows how many 1R winners, how many –1R losers, etc. Why it matters: gives a granular view of how frequently you hit different R-levels.',
          desc_ar:
            'لكل صفقة، R يُعرف على أنه (الربح أو الخسارة) ÷ (المخاطرة المُتخذة). الرسم البياني لمضاعفات R: يُظهر عدد الصفقات الفائزة عند 1R وعدد الصفقات الخاسرة عند –1R وهكذا. لماذا يهم: يعطي رؤية مفصلة لعدد المرات التي تحقق فيها مستويات R مختلفة.',
          importance: 'medium'
        },
        {
          key: 'avg_r_multiple',
          label_en: 'Average R:R',
          label_ar: 'متوسط R:R',
          desc_en:
            "Average of every individual trade's R-multiple. Why it matters: similar to average win/loss ratio but normalized to risk taken on each trade rather than raw P&L.",
          desc_ar:
            'متوسط المضاعف R لمجموعة الصفقات. لماذا يهم: مشابه لمتوسط نسبة الربح/الخسارة ولكنه يأخذ في الاعتبار المخاطرة في كل صفقة بدلاً من الربح/الخسارة الخام.',
          importance: 'high'
        },
      ],
    },
    {
      id: 3,
      title_en: 'Profitability & Efficiency Metrics',
      title_ar: 'مقاييس الربحية والكفاءة',
      color: 'from-green-500 to-emerald-600',
      icon: TrendingUp,
      items: [
        {
          key: 'profit_factor',
          label_en: 'Profit Factor',
          label_ar: 'عامل الربح',
          desc_en:
            '(Sum of profits from winning trades) ÷ (Sum of absolute losses from losing trades). Why it matters: > 1 means profitable; e.g. 2.0 means you make $2 for every $1 lost. The higher, the better.',
          desc_ar:
            '(مجموع أرباح الصفقات الرابحة) ÷ (مجموع الخسائر المطلقة للصفقات الخاسرة). لماذا يهم: إذا يزيد عن 1 فهو مربح؛ على سبيل المثال 2.0 يعني أنك تربح $2 لكل $1 تخسره. كلما زاد الرقم، كان أفضل.',
          importance: 'critical'
        },
        {
          key: 'expectancy',
          label_en: 'Expectancy',
          label_ar: 'التوقع (Expectancy)',
          desc_en:
            '(Win Rate × Average Win) – (Loss Rate × Average Loss). Or equivalently, (Average R:R × Win Rate) – [(1 – Win Rate) × 1]. Why it matters: the average expected return per trade (in currency or R-multiples).',
          desc_ar:
            '(نسبة الفوز × متوسط الربح) – (نسبة الخسارة × متوسط الخسارة). أو بالتساوي، (متوسط R:R × نسبة الفوز) – [(1 – نسبة الفوز) × 1]. لماذا يهم: هو متوسط العائد المتوقع لكل صفقة (بالعملة أو بمضاعفات R).',
          importance: 'critical'
        },
        {
          key: 'gross_profit',
          label_en: 'Gross Profit',
          label_ar: 'إجمالي الربح',
          desc_en:
            'Sum of all winning-trade profits. Why it matters: shows how much profit comes from winners alone.',
          desc_ar:
            'مجموع أرباح جميع الصفقات الرابحة. لماذا يهم: يُظهر مقدار الربح الذي يأتي من الصفقات الفائزة وحدها.',
          importance: 'medium'
        },
        {
          key: 'gross_loss',
          label_en: 'Gross Loss',
          label_ar: 'إجمالي الخسارة',
          desc_en:
            'Sum of all losing-trade losses (absolute value). Why it matters: shows how much loss comes from losers alone.',
          desc_ar:
            'مجموع خسائر جميع الصفقات الخاسرة (القيمة المطلقة). لماذا يهم: يُظهر مقدار الخسارة الذي يأتي من الصفقات الخاسرة وحدها.',
          importance: 'medium'
        },
      ],
    },
    {
      id: 4,
      title_en: 'Risk Metrics',
      title_ar: 'مقاييس المخاطرة',
      color: 'from-red-500 to-orange-600',
      icon: AlertTriangle,
      items: [
        {
          key: 'max_drawdown',
          label_en: 'Maximum Drawdown (Max DD)',
          label_ar: 'أقصى تراجع (Max DD)',
          desc_en:
            'The largest peak-to-trough decline in equity during the period (currency or %). Why it matters: measures the worst drop in your balance. Essential for understanding risk tolerance.',
          desc_ar:
            'أكبر انخفاض من القمة إلى القاع في الرسم البياني لرأس المال خلال الفترة (بالعملة أو ٪). لماذا يهم: يقيس أسوأ انخفاض في رصيدك. ضروري لفهم مدى تحمل المخاطرة.',
          importance: 'critical'
        },
        {
          key: 'drawdown_duration',
          label_en: 'Drawdown Duration',
          label_ar: 'مدة التراجع',
          desc_en:
            'How long (in days/weeks/trades) it took to recover from Max DD to a new equity high. Why it matters: shows resilience—طول فترة التراجع قد يؤثر على انضباطك.',
          desc_ar:
            'المدة (بأيام/أسابيع/عدد الصفقات) اللازمة للتعافي من أقصى تراجع ووصول رأس المال إلى أعلى مستوى جديد. لماذا يهم: يُظهر مدى قدرة النظام على التعافي—فترة التراجع الطويلة قد تؤثر على انضباطك.',
          importance: 'high'
        },
        {
          key: 'calmar_ratio',
          label_en: 'Calmar Ratio',
          label_ar: 'نسبة كالمار (Calmar Ratio)',
          desc_en:
            '(Annualized Return) ÷ (Maximum Drawdown). Why it matters: يوضح العائد بالنسبة للأسوأ تراجع—كلما كانت أعلى، كان أداءك أفضل.',
          desc_ar:
            '(العائد السنوي ÷ أقصى تراجع). لماذا يهم: يُظهر العائد مقارنة بأسوأ تراجع—كلما زادت النسبة، كان أداءك أقوى.',
          importance: 'medium'
        },
        {
          key: 'sharpe_ratio',
          label_en: 'Sharpe Ratio',
          label_ar: 'نسبة شارپ (Sharpe Ratio)',
          desc_en:
            '(Mean portfolio return – risk-free) ÷ (Standard deviation of return). Why it matters: قياس العائد المُعدل حسب المخاطرة. Sharpe > 1 جيد، > 2 ممتاز.',
          desc_ar:
            '(متوسط عائد المحفظة – العائد الخالي من المخاطرة) ÷ (الانحراف المعياري للعائد). لماذا يهم: يقيس العائد مقابل المخاطرة. إذا > 1 يُعتبر جيدًا، و> 2 يُعتبر ممتازًا.',
          importance: 'high'
        },
        {
          key: 'sortino_ratio',
          label_en: 'Sortino Ratio',
          label_ar: 'نسبة سورتينو (Sortino Ratio)',
          desc_en:
            'Similar to Sharpe but only penalizes downside volatility: (mean return – risk-free) ÷ (Downside deviation). Why it matters: يركّز على تقلبات الخسائر بدلاً من كل التقلب.',
          desc_ar:
            'مماثل لشارپ لكنه يعاقب فقط تقلبات الخسارة: (متوسط العائد – العائد الخالي من المخاطرة) ÷ (الانحراف نحو الأسفل). لماذا يهم: يركّز على تقلبات السلبية بدلاً من جميع التقلبات.',
          importance: 'medium'
        },
        {
          key: 'recovery_factor',
          label_en: 'Recovery Factor',
          label_ar: 'عامل التعافي (Recovery Factor)',
          desc_en:
            '(Net Profit) ÷ (Max Drawdown). Why it matters: عدد وحدات الأرباح مقابل كل وحدة تراجع—كلما زادت، كان أفضل.',
          desc_ar:
            '(صافي الربح ÷ أقصى تراجع). لماذا يهم: عدد وحدات الربح مقابل كل وحدة تراجع—كلما زادت، كانت استراتيجيتك أفضل.',
          importance: 'medium'
        },
        {
          key: 'var_95',
          label_en: 'Value at Risk (VaR 95%)',
          label_ar: 'قيمة المخاطرة (VaR 95%)',
          desc_en:
            'The estimated maximum loss over a chosen period at 95% confidence. Why it matters: يُقدّر أسوأ خسارة محتملة ضمن ظروف عادية.',
          desc_ar:
            'أسوأ خسارة محتملة متوقعة خلال فترة معينة بثقة 95%. لماذا يهم: يُقدّر أوسع نطاق خسارة محتملة في ظروف السوق العادية.',
          importance: 'medium'
        },
        {
          key: 'kelly_criterion',
          label_en: 'Kelly Criterion (Optimal %)',
          label_ar: 'معيار كيلي (النسبة المُثلى)',
          desc_en:
            'Kelly = Win Rate – [(1 – Win Rate) ÷ (Average Win/Loss Ratio)]. Why it matters: يقترح نسبة المخاطرة المثلى لتعظيم النمو الطويل الأجل.',
          desc_ar:
            'كيلي = نسبة الفوز – [(1 – نسبة الفوز) ÷ (متوسط الربح/الخسارة)]. لماذا يهم: يقترح النسبة المثالية للمخاطرة لتعظيم النمو طويل الأجل.',
          importance: 'high'
        },
      ],
    },
    {
      id: 5,
      title_en: 'Sequence & Streak Metrics',
      title_ar: 'مقاييس التتابع وسلسلة النتائج',
      color: 'from-amber-500 to-yellow-600',
      icon: Repeat,
      items: [
        {
          key: 'max_consecutive_wins',
          label_en: 'Max Consecutive Wins',
          label_ar: 'أقصى عدد انتصارات متتابعة',
          desc_en:
            'The longest winning streak. Why it matters: يساعدك على الاستعداد نفسيًا لمعدل انتصاراتك المستمر.',
          desc_ar:
            'أطول سلسلة من الصفقات الرابحة على التوالي. لماذا يهم: يُساعدك على الاستعداد نفسيًا لعدد الانتصارات التي قد تحصل عليها بشكل متتالي.',
          importance: 'medium'
        },
        {
          key: 'max_consecutive_losses',
          label_en: 'Max Consecutive Losses',
          label_ar: 'أقصى عدد خسائر متتابعة',
          desc_en:
            'The longest losing streak. Why it matters: يُعدّك للتحدي النفسي في مواجهة سلسلة خسائر.',
          desc_ar:
            'أطول سلسلة من الصفقات الخاسرة على التوالي. لماذا يهم: يُعدّك للتحديات النفسية الناتجة عن سلسلة خسائر.',
          importance: 'high'
        },
        {
          key: 'avg_winning_streak',
          label_en: 'Average Winning Streak',
          label_ar: 'متوسط طول سلسلة الانتصارات',
          desc_en:
            'Mean length of all winning streaks. Why it matters: يُظهر كيف تكون عادةً فترات الانتصار لديك.',
          desc_ar:
            'متوسط طول سلسلة الانتصارات عبر جميع دفعات الانتصار. لماذا يهم: يُظهر لك الطول النموذجي لفترات الانتصار لديك.',
          importance: 'medium'
        },
        {
          key: 'avg_losing_streak',
          label_en: 'Average Losing Streak',
          label_ar: 'متوسط طول سلسلة الخسائر',
          desc_en:
            'Mean length of all losing streaks. Why it matters: يُظهر لك كم تستغرق عادةً فترات الخسارة.',
          desc_ar:
            'متوسط طول سلسلة الخسائر عبر جميع دفعات الخسارة. لماذا يهم: يُظهر لك كم تستمر عادةً فترات الخسارة لديك.',
          importance: 'medium'
        },
      ],
    },
    {
      id: 6,
      title_en: 'Time & Period-Based Metrics',
      title_ar: 'مقاييس مبنية على الزمن والفترة',
      color: 'from-sky-500 to-blue-600',
      icon: Clock,
      items: [
        {
          key: 'equity_curve',
          label_en: 'Equity Curve',
          label_ar: 'منحنى رأس المال',
          desc_en:
            'Cumulative P&L plotted over time (daily, weekly, or per trade). Why it matters: visually shows how your equity evolves; highlights drawdowns, consistency, and growth phases.',
          desc_ar:
            'رسم تراكمي للربح/الخسارة على مدار الزمن (يوميًا، أسبوعيًا، أو لكل صفقة). لماذا يهم: يُظهر بصريًا كيف يتطور رأس مالك؛ يبرز فترات التراجع، والاستمرارية، ومراحل النمو.',
          importance: 'critical'
        },
        {
          key: 'monthly_pnl',
          label_en: 'Monthly/Weekly/Yearly P&L',
          label_ar: 'الربح/الخسارة الشهري/الأسبوعي/السنوي',
          desc_en:
            'P&L aggregated by calendar period. Why it matters: identifies seasonality or performance differences across different months/weeks/years.',
          desc_ar:
            'تجميع الربح/الخسارة حسب الفترة الزمنية (شهريًا/أسبوعيًا/سنويًا). لماذا يهم: يحدد وجود نمط موسمي أو اختلافات الأداء بين أشهر/أسابيع/سنوات مختلفة.',
          importance: 'high'
        },
        {
          key: 'time_in_market',
          label_en: 'Time in Market',
          label_ar: 'الوقت في السوق',
          desc_en:
            'Total time positions were open (e.g., sum of hours/days). Why it matters: for strategies where holding period matters, it informs you about capital efficiency.',
          desc_ar:
            'إجمالي الوقت الذي كانت فيه الصفقات مفتوحة (مثلاً مجموع الساعات/الأيام). لماذا يهم: في الاستراتيجيات التي تعتمد على فترة الاحتفاظ، يخبرك بكفاءة رأس المال.',
          importance: 'medium'
        },
        {
          key: 'profit_by_session',
          label_en: 'Profitability by Session or Time of Day',
          label_ar: 'الربحية حسب الجلسة أو وقت اليوم',
          desc_en:
            'Separate P&L, win rate, and average R:R for specific sessions (e.g., London, New York) or hourly buckets. Why it matters: many traders perform differently في جلسات مختلفة؛ معرفة هذا يساعدك على تحسين وقت التداول.',
          desc_ar:
            'فصل الربح/الخسارة، ونسبة الفوز، ومتوسط R:R لجلسات محددة (مثلاً لندن، نيويورك) أو لحقب زمنية بالساعة. لماذا يهم: الكثير من المتداولين يؤدون أداءً مختلفًا في جلسات مختلفة؛ معرفة ذلك تُساعدك على تحسين توقيت التداول.',
          importance: 'high'
        },
      ],
    },
    {
      id: 7,
      title_en: 'Instrument & Strategy Breakdown',
      title_ar: 'تحليل الأدوات والاستراتيجيات',
      color: 'from-violet-500 to-purple-600',
      icon: PieChart,
      items: [
        {
          key: 'performance_by_strategy',
          label_en: 'Performance by Strategy/Setup',
          label_ar: 'الأداء حسب الاستراتيجية/الإعداد',
          desc_en:
            'Compute P&L, win rate, expectancy for each strategy/setup type (e.g., breakout, reversal, continuation). Why it matters: helps identify which setups work best and which to avoid or improve.',
          desc_ar:
            'حساب الربح/الخسارة ونسبة الفوز والتوقع لكل نوع استراتيجية/إعداد (مثل الاختراق، الانعكاس، الاستمرار). لماذا يهم: يساعد في تحديد أي الإعدادات تعمل بشكل أفضل وأيها يجب تجنبها أو تحسينها.',
          importance: 'high'
        },
        {
          key: 'volume_analysis',
          label_en: 'Volume-Based Performance',
          label_ar: 'الأداء حسب الحجم',
          desc_en:
            'Performance metrics broken down by position size or trading volume. Why it matters: reveals if you perform better with larger or smaller positions.',
          desc_ar:
            'مقاييس الأداء مقسمة حسب حجم المركز أو حجم التداول. لماذا يهم: يكشف ما إذا كنت تؤدي أداءً أفضل مع المراكز الأكبر أو الأصغر.',
          importance: 'medium'
        },
      ],
    },
    {
      id: 8,
      title_en: 'Advanced Statistical Metrics',
      title_ar: 'المقاييس الإحصائية المتقدمة',
      color: 'from-teal-500 to-cyan-600',
      icon: Calculator,
      items: [
        {
          key: 'skewness',
          label_en: 'Skewness',
          label_ar: 'الالتواء (Skewness)',
          desc_en:
            'Measures asymmetry in P&L distribution. Positive skew = more frequent small losses, fewer large gains. Negative skew = more frequent small gains, fewer large losses.',
          desc_ar:
            'يقيس عدم التماثل في توزيع الربح/الخسارة. الالتواء الموجب = خسائر صغيرة متكررة، أرباح كبيرة أقل. الالتواء السالب = أرباح صغيرة متكررة، خسائر كبيرة أقل.',
          importance: 'medium'
        },
        {
          key: 'kurtosis',
          label_en: 'Kurtosis',
          label_ar: 'التفرطح (Kurtosis)',
          desc_en:
            'Measures tail heaviness of P&L distribution. High kurtosis indicates more extreme outcomes (fat tails). Why it matters: helps assess risk of extreme losses.',
          desc_ar:
            'يقيس ثقل الذيول في توزيع الربح/الخسارة. التفرطح العالي يشير إلى نتائج أكثر تطرفاً (ذيول سمينة). لماذا يهم: يساعد في تقييم مخاطر الخسائر المتطرفة.',
          importance: 'medium'
        },
        {
          key: 'correlation_analysis',
          label_en: 'Trade Correlation',
          label_ar: 'ارتباط الصفقات',
          desc_en:
            'Correlation between consecutive trades or trades on different instruments. Why it matters: high correlation may indicate overexposure to similar market conditions.',
          desc_ar:
            'الارتباط بين الصفقات المتتالية أو الصفقات على أدوات مختلفة. لماذا يهم: الارتباط العالي قد يشير إلى تعرض مفرط لظروف سوق متشابهة.',
          importance: 'medium'
        },
      ],
    },
  ];

  // Filter sections based on search and category
  const filteredSections = useMemo(() => {
    return sections.map(section => {
      const filteredItems = section.items.filter(item => {
        const matchesSearch = searchQuery === '' || 
          (lang === 'en' ? item.label_en : item.label_ar).toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lang === 'en' ? item.desc_en : item.desc_ar).toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = selectedCategory === 'all' || 
          (selectedCategory === 'critical' && item.importance === 'critical') ||
          (selectedCategory === 'high' && item.importance === 'high') ||
          (selectedCategory === 'medium' && item.importance === 'medium');
        
        return matchesSearch && matchesCategory;
      });
      
      return { ...section, items: filteredItems };
    }).filter(section => section.items.length > 0);
  }, [sections, searchQuery, selectedCategory, lang]);

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImportanceLabel = (importance) => {
    if (lang === 'en') {
      switch (importance) {
        case 'critical': return 'Critical';
        case 'high': return 'High';
        case 'medium': return 'Medium';
        default: return 'Low';
      }
    } else {
      switch (importance) {
        case 'critical': return 'حرج';
        case 'high': return 'عالي';
        case 'medium': return 'متوسط';
        default: return 'منخفض';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header with premium styling */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 relative">
                {lang === 'en' ? 'Trading Metrics Guide' : 'دليل مقاييس التداول'}
                <div className="absolute -bottom-1 left-0 w-16 h-1 bg-blue-600 rounded-full"></div>
              </h1>
              <p className="text-gray-600">
                {lang === 'en' 
                  ? 'Learn about essential trading performance metrics and their importance'
                  : 'تعلم عن مقاييس أداء التداول الأساسية وأهميتها'}
              </p>
            </div>
            
            {/* Language Toggle with refined design */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <span className={`text-sm font-medium ${lang === 'en' ? 'text-blue-600' : 'text-gray-400'}`}>EN</span>
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="relative w-12 h-6 rounded-full bg-gray-200 transition-colors duration-300"
                style={{
                  backgroundColor: lang === 'ar' ? '#3b82f6' : '#e5e7eb'
                }}
              >
                <span 
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300"
                  style={{
                    left: lang === 'ar' ? '7px' : '1px',
                    transform: lang === 'ar' ? 'translateX(16px)' : 'translateX(0)'
                  }}
                ></span>
              </button>
              <span className={`text-sm font-medium ${lang === 'ar' ? 'text-blue-600' : 'text-gray-400'}`}>AR</span>
            </div>
          </div>
        </div>

        {/* Search and Filter with refined design */}
        <div className="mb-10 bg-white rounded-2xl shadow-md p-6 border border-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search metrics...' : 'البحث في المقاييس...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200"
              >
                <option value="all">{lang === 'en' ? 'All Importance' : 'جميع المستويات'}</option>
                <option value="critical">{lang === 'en' ? 'Critical' : 'حرج'}</option>
                <option value="high">{lang === 'en' ? 'High' : 'عالي'}</option>
                <option value="medium">{lang === 'en' ? 'Medium' : 'متوسط'}</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-500" viewBox="0 0 16 16">
                  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Sections with premium design */}
        <div className="space-y-10">
          {filteredSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-50">
                {/* Section Header with refined gradient */}
                <div className={`bg-gradient-to-r ${section.color} p-6 text-white relative`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-2.5 rounded-lg backdrop-blur-sm">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">
                      {lang === 'en' ? section.title_en : section.title_ar}
                    </h2>
                  </div>
                </div>
                
                {/* Section Items with refined card design */}
                <div className="p-6 md:p-8">
                  <div className="grid gap-6">
                    {section.items.map((item) => (
                      <div key={item.key} className="border border-gray-100 rounded-xl p-5 hover:shadow-lg transition-shadow duration-300 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lang === 'en' ? item.label_en : item.label_ar}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getImportanceColor(item.importance)}`}>
                            {getImportanceLabel(item.importance)}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {lang === 'en' ? item.desc_en : item.desc_ar}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results with refined empty state */}
        {filteredSections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-50">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {lang === 'en' ? 'No metrics found' : 'لم يتم العثور على مقاييس'}
            </h3>
            <p className="text-gray-600">
              {lang === 'en' 
                ? 'Try adjusting your search terms or filters'
                : 'جرب تعديل مصطلحات البحث أو المرشحات'}
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-6 px-5 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-medium text-sm"
            >
              {lang === 'en' ? 'Reset filters' : 'إعادة ضبط المرشحات'}
            </button>
          </div>
        )}
      </div>

      {/* Add custom CSS for enhanced visuals */}
      <style jsx>{`
        /* Custom scrollbar for modern browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        
        /* Card hover effect */
        div[key] {
          transform: translateY(0);
        }
        div[key]:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default TradingMetricsGuide;
