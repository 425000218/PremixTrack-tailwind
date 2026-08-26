# Hướng Dẫn Đóng Gói Docker & Triển Khai Trên Cụm 3 LXC Proxmox (NUC 6 CAY)

---

## 🏗️ 1. Sơ Đồ Kiến Trúc Hệ Thống Proxmox (NUC 6 CAY):

```
       🌐 INTERNET (Người dùng từ 22 Nhà máy & Ban Giám Đốc)
                         │
                         ▼ (HTTPS / SSL Zero Trust - Không mở Port Router)
       ┌────────────────────────────────────────────────────────┐
       │  LXC 100: GATEWAY & BẢO MẬT (500MB RAM, 2GB SSD)       │
       │  • Cloudflare Tunnel (cloudflared)                     │
       │  • Tailscale VPN                                       │
       └────────────────────────────────────────────────────────┘
                         │ (Mạng nội bộ Proxmox Bridge / 1Gbps)
                         ▼
       ┌────────────────────────────────────────────────────────┐
       │  LXC 101: WEB & API BACKEND (2GB RAM, 16GB SSD)        │
       │  • Docker Container: premixtrack-app (Port 3000)       │
       │  • Frontend React Vite + Backend Node Express          │
       └────────────────────────────────────────────────────────┘
                         │ (TCP Port 1433)
                         ▼
       ┌────────────────────────────────────────────────────────┐
       │  LXC 102: DATABASE SERVER (2GB RAM, 16GB SSD)          │
       │  • MS SQL Server 2022 (IP: 192.168.1.202:1433)         │
       │  • Database: PremixTrackDB (12 bảng + Stored Procs)   │
       └────────────────────────────────────────────────────────┘
```

---

## 🚀 2. Quy Trình Push Code Lên GitHub:

Tại máy tính cá nhân của bạn, chạy các lệnh:

```bash
git add .
git commit -m "Feat: Hoàn thiện Docker package, Login Gate và đồng bộ MS SQL 2022"
git push origin main
```

---

## 🛠️ 3. Thiết Lập & Khởi Chạy Lần Đầu Trên LXC 101:

### Bước 3.1: Cài đặt Docker & Docker Compose trên LXC 101 (nếu chưa có)
```bash
# Cập nhật package
sudo apt update && sudo apt install -y curl git

# Cài đặt Docker tự động
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cấp quyền cho user hiện tại
sudo usermod -aG docker $USER
```

### Bước 3.2: Clone mã nguồn từ GitHub về LXC 101
```bash
cd /opt
sudo git clone <URL_REPO_GITHUB_CỦA_BẠN> premixtrack
cd premixtrack
```

### Bước 3.3: Tạo file `.env` trên LXC 101
Tạo file `.env` với nội dung kết nối đến LXC 102 (`192.168.1.202`):
```bash
nano .env
```
Dán nội dung cấu hình:
```ini
# CẤU HÌNH MS SQL SERVER 2022 TRÊN LXC 102
DB_SERVER=192.168.1.202
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=Dangbacnam@2026!
DB_NAME=PremixTrackDB
DB_ENCRYPT=false

# CẤU HÌNH AI LOCAL (NẾU CÓ)
OLLAMA_HOST=http://192.168.1.222:11434
OLLAMA_MODEL=qwen2.5:3b

# CẤU HÌNH APP
PORT=3000
NODE_ENV=production
```

### Bước 3.4: Chạy deploy bằng 1 lệnh duy nhất
```bash
chmod +x deploy_lxc101.sh
./deploy_lxc101.sh
```

---

## 🔄 4. Mỗi Lần Cập Nhật Tính Năng Mới Sau Này:
Chỉ cần SSH vào LXC 101 và chạy:
```bash
cd /opt/premixtrack
./deploy_lxc101.sh
```
Script sẽ tự động: `git pull` ➔ `docker build` ➔ `restart container` ➔ `chạy migration database nếu có bản vá mới`.

---

## 🌐 5. Cấu Hình Cloudflare Tunnel Trên LXC 100:

Trên **LXC 100** (nơi chạy `cloudflared`):
1. Thêm Ingress rule trỏ domain của bạn (ví dụ `premix.domaincuaban.com`) vào địa chỉ IP của **LXC 101**:
   ```yaml
   ingress:
     - hostname: premix.domaincuaban.com
       service: http://<IP_CỦA_LXC_101>:3000
     - service: http_status:404
   ```
2. Khởi động lại service Cloudflare Tunnel trên LXC 100:
   ```bash
   sudo systemctl restart cloudflared
   ```
3. **Kết quả**: Truy cập từ bất kỳ đâu qua Internet bằng `https://premix.domaincuaban.com` với chứng chỉ SSL/HTTPS ổ khóa xanh bảo mật, không cần mở bất kỳ port nào trên Router!
