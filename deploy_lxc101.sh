#!/bin/bash
# ==============================================================================
# SCRIPT TỰ ĐỘNG DEPLOY & CẬP NHẬT TRÊN LXC 101 (PROXMOX NUC 6 CAY)
# ==============================================================================
set -e

echo "=================================================================="
echo "🚀 [1/4] Đang cập nhật mã nguồn mới nhất từ GitHub..."
echo "=================================================================="
git pull

echo "=================================================================="
echo "📦 [2/4] Đang đóng gói Docker & Khởi chạy Container (Multi-stage)..."
echo "=================================================================="
docker compose down || true
docker compose up -d --build --remove-orphans

echo "=================================================================="
echo "📡 [3/4] Đang chạy tự động cập nhật Migration Database (LXC 102)..."
echo "=================================================================="
# Tùy chọn: Chạy migration nếu có bản vá mới
docker compose exec -T premixtrack-app npm run db:migrate || echo "⚠️ Migration đã chạy hoặc bỏ qua"

echo "=================================================================="
echo "🔍 [4/4] Kiểm tra trạng thái hoạt động..."
echo "=================================================================="
sleep 3
docker compose ps

echo "=================================================================="
echo "🎉 DEPLOY HOÀN TẤT THÀNH CÔNG!"
echo "🌐 Ứng dụng Web: http://<IP_LXC_101>:3000"
echo "🗄️ Database MSSQL: 192.168.1.202:1433 (LXC 102)"
echo "🛡️ Gateway Ingress: LXC 100 (Cloudflare Tunnel + Tailscale)"
echo "=================================================================="
