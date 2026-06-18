静态电影网站生成说明

网站名称：日韩最新电影
首页：index.html
影片数量：2000
详情页数量：2000
播放器：详情页已绑定 HLS 播放源，并使用 hls.js 初始化逻辑。
封面图片：页面引用顶级目录 1.jpg 到 150.jpg，按影片编号循环对应。请将同名图片放到网站根目录即可显示。
播放源数量：从上传 JS 中提取到 20 个不重复 m3u8 播放源，并按影片编号循环绑定。

目录结构：
- index.html：首页，包含 Hero 首屏轮播、推荐区、分类区、排行榜区块
- categories.html：分类总览页
- category-*.html：独立分类页
- ranking.html：排行榜页
- search.html：全站搜索筛选页，包含全部影片卡片
- sitemap.html：全站索引页，包含全部详情页入口
- video/*.html：影片详情页与播放器
- assets/css/style.css：未压缩 CSS
- assets/js/site.js：未压缩 JS

注意：所有 HTML 页面均已插入百度统计代码，代码位于页面底部 script 中，不会作为页面文字显示。
