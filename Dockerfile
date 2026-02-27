FROM node:16 AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build


FROM nginx:1.19.0-alpine
# 将构建的React应用复制到Nginx的html目录
COPY --from=builder /app/build /usr/share/nginx/html
# 复制启动脚本（运行时注入环境变量）
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
# 暴露端口80
EXPOSE 80
# 使用入口脚本启动（先生成 env-config.js，再启动 nginx）
ENTRYPOINT ["/docker-entrypoint.sh"]
