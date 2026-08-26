# ==============================================================================
# PREMIXTRACK ENTERPRISE DOCKERFILE (MULTI-STAGE BUILD)
# Tối ưu hóa dung lượng nhẹ (~150MB) cho máy chủ LXC101 (RAM 2GB, SSD 16GB)
# ==============================================================================

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 1: BUILDER (Biên dịch Frontend Vite & Backend TypeScript)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Cài đặt dependencies cần thiết cho build
COPY package*.json ./
RUN npm ci

# Sao chép toàn bộ source code
COPY . .

# Biên dịch Frontend (Vite) và Backend (Esbuild)
RUN npm run build
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# Loại bỏ devDependencies để giảm tối đa dung lượng
RUN npm prune --production

# ------------------------------------------------------------------------------
# GIAI ĐOẠN 2: RUNNER PRODUCTION (Chạy ứng dụng tối ưu RAM)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Cài đặt curl phục vụ healthcheck
RUN apk add --no-cache curl

# Tạo user không có đặc quyền root để tăng cường bảo mật
RUN addgroup -g 1001 -S nodejs && adduser -S premixtrack -u 1001

# Sao chép các tệp cần thiết từ builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database
COPY --from=builder /app/server ./server

# Phân quyền cho user premixtrack
RUN chown -R premixtrack:nodejs /app

USER premixtrack

# Mở cổng 3000 cho Web & API
EXPOSE 3000

# Kiểm tra tình trạng sức khỏe ứng dụng định kỳ
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/db/status || exit 1

# Khởi chạy máy chủ Production
CMD ["node", "dist/server.cjs"]
