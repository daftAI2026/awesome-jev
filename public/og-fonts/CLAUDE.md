# public/og-fonts/
> L2 | 父级: ../CLAUDE.md

成员清单
Geist-Regular.ttf: TTF 正文，固定 Vercel Geist 字库，不依赖Worker 宿主字体
Geist-SemiBold.ttf: TTF 全站项目计数，保持与页面 Geist 字重一致
GeistMono-Regular.ttf: TTF ASCII 字标与仓库身份，等宽排版不随宿主变化
NotoSansSC.ttf: TTF 中日韩正文回退，固定 400 字重完整字库避免新项目文字变成缺字方块和细线字体，仅在 CJK 图像缓存未命中时加载
Geist-OFL.txt: Geist 的 SIL Open Font License 1.1
Noto-OFL.txt: Noto 的 SIL Open Font License 1.1

字体来源固定为 vercel/geist-font 的提交 10dc7658f13c38a474cde201bb09a4617267545b（fonts/Geist/ttf、fonts/GeistMono/ttf）和 notofonts/noto-cjk 的提交 f8d157532fbfaeda587e826d4cd5b21a49186f7c（google-fonts/NotoSansSC[wght].ttf）。Noto 源为可变字库，用 fontTools 4.60.2 的 `fonttools varLib.instancer NotoSansSC-variable.ttf wght=400 --output NotoSansSC.ttf` 固定字重，保留完整字符集，避免 Resvg 使用变量字体默认的 100 字重。更新字库时同步许可证并递增 share-image.ts 的 IMAGE_VERSION。字库作为 Static Assets 发布，由 Worker ASSETS 绑定读取，不嵌入 Worker JavaScript 或浏览器启动包。不能按当前目录裁剪成未来新字符缺失的字库。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
