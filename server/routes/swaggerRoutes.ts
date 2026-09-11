import { Router } from 'express';

const router = Router();

// OpenAPI 3.0.0 Specification Data
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "PremixTrack Enterprise API Specification",
    version: "2.5.0",
    description: `
### Hệ Thống Điều Phối & Quản Lý Tồn Kho Premix - Thức Ăn Gia Súc D365 FO
- **Kiến trúc hạ tầng Proxmox NUC 6 Cây**: Gateway Ingress (LXC 100) -> Node.js Core Backend (LXC 101) -> MS SQL Server 2022 Enterprise (LXC 102).
- **Phân quyền RBAC**: System_Admin, Supply_Chain_Manager, Factory_Planner, Logistics_Officer, Viewer.
- **Xác thực**: JWT Bearer Token (gửi trong header: \`Authorization: Bearer <token>\`) hoặc Cookie httpOnly.
    `,
    contact: {
      name: "PremixTrack SCM Engineering Team"
    }
  },
  servers: [
    {
      url: "/api",
      description: "Production & Staging API Gateway"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập JWT token sinh ra từ /api/auth/login"
      }
    }
  },
  tags: [
    { name: "Authentication & RBAC", description: "Đăng nhập, đăng ký, lấy profile, phân quyền và quản lý tài khoản DB" },
    { name: "Bootstrap & System Health", description: "Kiểm tra kết nối MS SQL Server và tải gói dữ liệu khởi động" },
    { name: "Raw Data Storage & Import History", description: "Lưu file Excel raw (/opt/DataImport_premixtrack) và tra cứu nhật ký kiểm toán" },
    { name: "Master Data Management", description: "Quản lý 22 Nhà máy, Nguyên liệu, BOM công thức, Nhà cung cấp, Quy tắc thế chân" },
    { name: "Inventory & Stock SOH", description: "Tồn kho thực tế (SOH Cut-off), dữ liệu tiêu hao sản xuất và điều chuyển" },
    { name: "Forecast (RD)", description: "Dự báo nhu cầu sản xuất đa nhà máy và so sánh phiên bản (Versions)" },
    { name: "Purchase Orders & Inbound", description: "Đơn mua hàng PO pending và lịch giao hàng dự kiến (Inbound Logistics)" },
    { name: "Position Matrix Engine", description: "Bộ máy tính toán vị thế cung ứng tức thì, DOI và ngày cạn hàng an toàn" },
    { name: "AI Supply Chain Advisor", description: "Trợ lý AI phân tích và khuyến nghị chuyển đổi kho (Gemini / Ollama)" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Bootstrap & System Health"],
        summary: "Kiểm tra sức khỏe hệ thống & MSSQL Server",
        responses: {
          "200": {
            description: "Trạng thái máy chủ và kết nối MSSQL LXC 102"
          }
        }
      }
    },
    "/bootstrap/all": {
      get: {
        tags: ["Bootstrap & System Health"],
        summary: "Tải toàn bộ dữ liệu khởi động cho WebApp",
        responses: {
          "200": {
            description: "Gói tổng hợp Master Data, SOH, Forecast và PO"
          }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Authentication & RBAC"],
        summary: "Đăng nhập hệ thống (MSSQL sys_User_Account)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "admin" },
                  password: { type: "string", example: "admin123" }
                },
                required: ["username", "password"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Đăng nhập thành công, trả về JWT Token và User Profile" },
          "401": { description: "Sai thông tin đăng nhập" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Authentication & RBAC"],
        summary: "Đăng ký tài khoản người dùng mới (Trạng thái chờ Admin duyệt)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "planner_bd" },
                  password: { type: "string", example: "P@ssw0rd2026" },
                  fullName: { type: "string", example: "Kỹ Sư Điều Phối Bình Dương" },
                  email: { type: "string", example: "planner.bd@premixtrack.com" }
                },
                required: ["username", "password", "fullName", "email"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Đăng ký thành công" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Authentication & RBAC"],
        summary: "Lấy thông tin người dùng hiện tại từ JWT Token",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Thông tin tài khoản và phân quyền" }
        }
      }
    },
    "/users": {
      get: {
        tags: ["Authentication & RBAC"],
        summary: "Danh sách người dùng hệ thống (Chỉ Admin)",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Danh sách tài khoản từ MSSQL sys_User_Account" }
        }
      }
    },
    "/import/save-raw": {
      post: {
        tags: ["Raw Data Storage & Import History"],
        summary: "Lưu file Excel raw lên thư mục Host (/opt/DataImport_premixtrack) và ghi log MSSQL",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fileName: { type: "string", example: "SOH_Cutoff_20260911.xlsx" },
                  fileBase64: { type: "string", description: "Chuỗi Base64 của file Excel" },
                  importType: { type: "string", enum: ["SOH", "Forecast", "PO_Inbound", "Usage"], example: "SOH" },
                  snapshotDate: { type: "string", format: "date", example: "2026-09-11" },
                  totalRows: { type: "integer", example: 1450 },
                  validRows: { type: "integer", example: 1448 },
                  errorRows: { type: "integer", example: 2 },
                  uploadedBy: { type: "string", example: "admin" },
                  notes: { type: "string", example: "Nạp dữ liệu chốt ca ngày 11/09" }
                },
                required: ["fileName", "fileBase64", "importType", "snapshotDate"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Lưu file thành công và đã ghi vết kiểm toán" }
        }
      }
    },
    "/import/history": {
      get: {
        tags: ["Raw Data Storage & Import History"],
        summary: "Lấy 100 bản ghi lịch sử nạp file Excel gần nhất từ MSSQL",
        responses: {
          "200": { description: "Nhật ký nạp file và kiểm toán" }
        }
      }
    },
    "/masterdata/materials": {
      get: {
        tags: ["Master Data Management"],
        summary: "Danh sách danh mục nguyên liệu Premix (dim_Material)",
        responses: {
          "200": { description: "Danh sách nguyên liệu" }
        }
      }
    },
    "/masterdata/factories": {
      get: {
        tags: ["Master Data Management"],
        summary: "Danh mục 22 Nhà máy toàn quốc (dim_Factory)",
        responses: {
          "200": { description: "Danh sách 22 nhà máy" }
        }
      }
    },
    "/masterdata/mappings": {
      get: {
        tags: ["Master Data Management"],
        summary: "Từ điển ánh xạ cột thông minh (sys_Import_Mapping)",
        responses: {
          "200": { description: "Danh mục các cột đã được AI/User ánh xạ" }
        }
      }
    },
    "/inventory/all": {
      get: {
        tags: ["Inventory & Stock SOH"],
        summary: "Toàn bộ dữ liệu tồn kho SOH, tiêu hao sản xuất và điều chuyển",
        responses: {
          "200": { description: "Dữ liệu tồn kho và tiêu hao" }
        }
      }
    },
    "/forecast/all": {
      get: {
        tags: ["Forecast (RD)"],
        summary: "Toàn bộ các phiên bản dự báo (Forecast Run Versions & Details)",
        responses: {
          "200": { description: "Dữ liệu forecast 22 nhà máy" }
        }
      }
    },
    "/purchase-orders/all": {
      get: {
        tags: ["Purchase Orders & Inbound"],
        summary: "Danh sách đơn mua hàng PO Pending & Lịch giao hàng Inbound",
        responses: {
          "200": { description: "Dữ liệu PO D365 FO" }
        }
      }
    },
    "/position/matrix": {
      get: {
        tags: ["Position Matrix Engine"],
        summary: "Lấy bảng tính vị thế cung ứng theo Ngày Chốt (Snapshot Date)",
        parameters: [
          {
            name: "snapshotDate",
            in: "query",
            required: false,
            schema: { type: "string", format: "date", example: "2026-08-25" },
            description: "Ngày chốt số liệu"
          }
        ],
        responses: {
          "200": { description: "Ma trận vị thế cung ứng, DOI, số ngày tồn và trạng thái cảnh báo" }
        }
      }
    },
    "/position/calculate": {
      post: {
        tags: ["Position Matrix Engine"],
        summary: "Kích hoạt Stored Procedure tính toán lại Ma Trận Vị Thế",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  snapshotDate: { type: "string", format: "date", example: "2026-08-25" },
                  cutoffWorkingDays: { type: "integer", example: 22 },
                  standardMonthDays: { type: "integer", example: 28 }
                },
                required: ["snapshotDate"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Tính toán thành công, ma trận đã được cập nhật" }
        }
      }
    },
    "/ai/advisor": {
      post: {
        tags: ["AI Supply Chain Advisor"],
        summary: "Cố vấn AI phân tích rủi ro chuỗi cung ứng & khuyến nghị điều chuyển",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: { type: "string", example: "Phân tích nguy cơ cạn hàng Premix Vitamin A tại nhà máy Bình Dương trong 14 ngày tới." },
                  contextData: { type: "object", description: "Dữ liệu SOH và Forecast kèm theo" },
                  mode: { type: "string", example: "thinking" },
                  snapshotDate: { type: "string", example: "2026-08-25" }
                },
                required: ["prompt"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Phản hồi phân tích chuyên sâu từ AI" }
        }
      }
    },
    "/ai/chat": {
      post: {
        tags: ["AI Supply Chain Advisor"],
        summary: "Hỏi đáp & Khuyến nghị chuỗi cung ứng với AI (Gemini / Ollama LAN)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: { type: "string", example: "Phân tích nguy cơ cạn hàng Premix Vitamin A tại nhà máy Bình Dương trong 14 ngày tới." },
                  contextData: { type: "object", description: "Dữ liệu SOH và Forecast kèm theo" }
                },
                required: ["prompt"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Phản hồi phân tích chuyên sâu từ AI" }
        }
      }
    }
  }
};

// ============================================================================
// HTTP BASIC AUTHENTICATION MIDDLEWARE FOR SWAGGER
// ============================================================================
function swaggerAuthMiddleware(req: any, res: any, next: any) {
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPass = process.env.SWAGGER_PASSWORD;

  // Fail-closed nếu chưa cấu hình trong .env
  if (!swaggerUser || !swaggerPass) {
    return res.status(503).send('Dịch vụ tài liệu API đang tạm khóa: Chưa cấu hình SWAGGER_USER hoặc SWAGGER_PASSWORD trong file .env.');
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="PremixTrack Secure API Documentation"');
    return res.status(401).send('Access Denied: Vui lòng nhập tài khoản và mật khẩu để xem tài liệu API.');
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const separatorIdx = credentials.indexOf(':');
    if (separatorIdx === -1) {
      res.setHeader('WWW-Authenticate', 'Basic realm="PremixTrack Secure API Documentation"');
      return res.status(401).send('Access Denied: Định dạng thông tin xác thực không hợp lệ.');
    }
    const username = credentials.substring(0, separatorIdx);
    const password = credentials.substring(separatorIdx + 1);

    if (username === swaggerUser && password === swaggerPass) {
      return next();
    }
  } catch (err) {
    // Fallthrough to 401
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="PremixTrack Secure API Documentation"');
  return res.status(401).send('Access Denied: Sai tên đăng nhập hoặc mật khẩu xem tài liệu API.');
}

// Endpoint trả về JSON OpenAPI Spec (Bảo vệ bằng Basic Auth)
router.get('/swagger-spec.json', swaggerAuthMiddleware, (req, res) => {
  res.json(openApiSpec);
});

// Giao diện Swagger UI hiện đại (Bảo vệ bằng Basic Auth)
router.get('/swagger', swaggerAuthMiddleware, (req, res) => {
  const fileBrowserUrl = process.env.FILEBROWSER_STORAGE_URL || '';
  const fileBrowserBtnHtml = fileBrowserUrl
    ? `<a href="${fileBrowserUrl}" target="_blank" class="btn-link btn-secondary"><span>Kho Raw Data</span></a>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PremixTrack API Documentation & Interactive Explorer</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #0b0f19;
      --bg-card: #111827;
      --bg-card-hover: #1f2937;
      --border-color: #1f2937;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #3b82f6;
      --accent-glow: rgba(59, 130, 246, 0.25);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* Modern Topbar */
    .custom-header {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 14px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #fff;
      font-weight: 800;
      font-size: 13px;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 0 16px var(--accent-glow);
      letter-spacing: 0.5px;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .brand-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .header-links {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: #1f2937;
      color: #e5e7eb;
      border: 1px solid #374151;
    }
    .btn-secondary:hover {
      background: #374151;
      color: #fff;
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.3);
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }

    /* Swagger UI Custom Dark Styling */
    .swagger-ui {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px 80px;
      font-family: inherit;
    }

    .swagger-ui .info {
      margin: 20px 0 30px;
    }

    .swagger-ui .info .title {
      color: #fff !important;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .swagger-ui .info .description p,
    .swagger-ui .info .description li {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
    }

    .swagger-ui .scheme-container {
      background: var(--bg-card) !important;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      box-shadow: none;
      padding: 16px 20px;
      margin-bottom: 24px;
    }

    .swagger-ui .opblock-tag {
      font-family: inherit;
      font-size: 17px;
      font-weight: 700;
      color: #e2e8f0 !important;
      border-bottom: 1px solid var(--border-color) !important;
      padding: 16px 0 8px;
      margin: 24px 0 12px;
    }

    .swagger-ui .opblock {
      border-radius: 12px !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      margin: 0 0 14px !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
      transition: transform 0.15s ease, border-color 0.15s ease;
    }

    .swagger-ui .opblock:hover {
      border-color: rgba(255, 255, 255, 0.18) !important;
    }

    .swagger-ui .opblock .opblock-summary {
      padding: 10px 14px;
    }

    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 8px !important;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
    }

    .swagger-ui .opblock .opblock-summary-path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: #f1f5f9 !important;
    }

    .swagger-ui .opblock .opblock-summary-description {
      font-size: 13px;
      color: #94a3b8 !important;
    }

    .swagger-ui .opblock-body {
      background: #0f172a !important;
      color: #e2e8f0;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .swagger-ui table thead tr th,
    .swagger-ui table thead tr td {
      color: #cbd5e1 !important;
      font-size: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .swagger-ui .response-col_status {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      color: #38bdf8;
    }

    .swagger-ui .btn.authorize {
      background: #2563eb !important;
      border-color: #2563eb !important;
      color: #fff !important;
      border-radius: 10px;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 16px;
    }

    .swagger-ui .btn.authorize svg {
      fill: #fff !important;
    }

    .swagger-ui input[type=text],
    .swagger-ui textarea,
    .swagger-ui select {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .swagger-ui .btn.execute {
      background: #10b981 !important;
      border-color: #10b981 !important;
      color: #fff !important;
      border-radius: 10px;
      font-weight: 700;
    }

    .swagger-ui pre {
      background: #020617 !important;
      border: 1px solid #1e293b;
      border-radius: 10px;
      color: #a5f3fc !important;
      font-family: 'JetBrains Mono', monospace !important;
    }
  </style>
</head>
<body>
  <!-- Modern Dev Header -->
  <header class="custom-header">
    <div class="brand-wrap">
      <div class="brand-badge">PREMIXTRACK API</div>
      <div>
        <div class="brand-title">Interactive API Documentation</div>
        <div class="brand-sub">Enterprise MS SQL Server 2022 &amp; Node.js Services</div>
      </div>
    </div>
    <div class="header-links">
      <a href="/api/swagger-spec.json" target="_blank" class="btn-link btn-secondary">
        <span>Raw OpenAPI Spec (JSON)</span>
      </a>
      ${fileBrowserBtnHtml}
      <a href="/" class="btn-link btn-primary">
        <span>Vào WebApp Chính &rarr;</span>
      </a>
    </div>
  </header>

  <!-- Swagger UI Root Container -->
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "/api/swagger-spec.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list",
        filter: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
