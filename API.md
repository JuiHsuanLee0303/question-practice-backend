# API Documentation

## 目錄

- [認證 (Authentication)](#認證-authentication)
- [用戶管理 (Users)](#用戶管理-users)
- [問題管理 (Questions)](#問題管理-questions)
- [記錄管理 (Records)](#記錄管理-records)

## 認證 (Authentication)

### 登入

```http
POST /auth/login
```

**請求體 (Request Body)**

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**成功響應 (Success Response)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
    "username": "username",
    "role": "user"
  }
}
```

## 用戶管理 (Users)

### 創建用戶

```http
POST /users
```

**請求體 (Request Body)**

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user" // 可選，默認為 "user"
}
```

**成功響應 (Success Response)**

```json
{
  "uid": "generated-uid",
  "username": "newuser",
  "email": "user@example.com",
  "role": "user",
  "createdAt": 1639651200000
}
```

### 獲取所有用戶

```http
GET /users
```

**需要認證：** 是
**需要權限：** admin

**成功響應 (Success Response)**

```json
{
  "user-id-1": {
    "username": "user1",
    "email": "user1@example.com",
    "role": "user"
  },
  "user-id-2": {
    "username": "user2",
    "email": "user2@example.com",
    "role": "admin"
  }
}
```

### 獲取特定用戶

```http
GET /users/:uid
```

**需要認證：** 是

**參數**

- `uid`: 用戶 ID

**成功響應 (Success Response)**

```json
{
  "username": "username",
  "email": "user@example.com",
  "role": "user",
  "createdAt": 1639651200000
}
```

### 更新用戶

```http
PATCH /users/:uid
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `uid`: 用戶 ID

**請求體 (Request Body)**

```json
{
  "username": "newusername", // 可選
  "email": "newemail@example.com", // 可選
  "password": "newpassword", // 可選
  "role": "admin" // 可選
}
```

### 刪除用戶

```http
DELETE /users/:uid
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `uid`: 用戶 ID

**成功響應 (Success Response)**

```json
{
  "message": "User deleted successfully"
}
```

## 問題管理 (Questions)

### 創建問題

```http
POST /questions
```

**需要認證：** 是
**需要權限：** admin

**請求體 (Request Body)**

```json
{
  "title": "問題標題",
  "description": "問題描述",
  "category": "問題類別",
  "options": ["選項A", "選項B", "選項C", "選項D"],
  "answer": "正確答案",
  "difficulty": "easy" // easy, medium, hard
}
```

### 獲取所有問題

```http
GET /questions
```

**需要認證：** 是

**查詢參數**

- `category` (可選): 按類別過濾
- `difficulty` (可選): 按難度過濾

### 獲取隨機問題

```http
GET /questions/random
```

**需要認證：** 是

**查詢參數**

- `category` (可選): 按類別過濾
- `limit` (可選): 返回問題數量，默認為 1

### 獲取特定問題

```http
GET /questions/:id
```

**需要認證：** 是

**參數**

- `id`: 問題 ID

### 更新問題

```http
PATCH /questions/:id
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `id`: 問題 ID

### 刪除問題

```http
DELETE /questions/:id
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `id`: 問題 ID

## 記錄管理 (Records)

### 創建記錄

```http
POST /records
```

**需要認證：** 是

**請求體 (Request Body)**

```json
{
  "questionId": "問題ID",
  "answer": "用戶答案",
  "timeSpent": 30 // 答題時間（秒）
}
```

### 獲取所有記錄

```http
GET /records
```

**需要認證：** 是
**需要權限：** admin

### 獲取用戶記錄

```http
GET /records/user/:userId
```

**需要認證：** 是

**參數**

- `userId`: 用戶 ID（只能查看自己的記錄，除非是管理員）

### 獲取用戶統計

```http
GET /records/stats/:userId
```

**需要認證：** 是

**參數**

- `userId`: 用戶 ID（只能查看自己的統計，除非是管理員）

**成功響應 (Success Response)**

```json
{
  "totalAnswered": 100,
  "correctCount": 75,
  "accuracy": 0.75,
  "averageTime": 25.5,
  "byCategory": {
    "category1": {
      "answered": 50,
      "correct": 40,
      "accuracy": 0.8
    }
  }
}
```

## 通用信息

### 認證

所有需要認證的請求都需要在 Header 中包含 JWT token：

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 錯誤響應

```json
{
  "statusCode": 400/401/403/404,
  "message": "Error message",
  "error": "Error type"
}
```

常見錯誤碼：

- 400: Bad Request (請求格式錯誤)
- 401: Unauthorized (未認證)
- 403: Forbidden (無權限)
- 404: Not Found (資源不存在)

### 角色權限

系統中有兩種角色：

- `user`: 普通用戶
- `admin`: 管理員

管理員可以：

- 查看所有用戶信息
- 創建/更新/刪除任何用戶
- 更改用戶角色
- 管理問題庫
- 查看所有用戶的記錄

普通用戶可以：

- 查看自己的用戶信息
- 更新自己的基本信息（除了角色）
- 查看和回答問題
- 查看自己的答題記錄和統計
