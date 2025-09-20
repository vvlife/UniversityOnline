# University Online

一个免费的在线学习路径生成平台，帮助用户发现和学习各个专业领域的核心课程。

## 功能特点

- 根据专业名称生成学习路径
- 为每门课程提供免费的在线学习资源
- 支持中英文双语界面
- 分享和探索热门学习路径

## 技术栈

- Next.js 15
- React 19
- Supabase
- Tailwind CSS
- Shadcn UI

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 环境变量

项目需要以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BRAVE_API_KEY=your_brave_search_api_key
SILICONFLOW_API_KEY=your_siliconflow_api_key
```

## 许可证

MIT