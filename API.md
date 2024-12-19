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

### 驗證令牌

```http
GET /auth/verify
```

**需要認證：** 是

**成功響應 (Success Response)**

```json
{
  "isValid": true,
  "user": {
    "uid": "user-id",
    "email": "user@example.com",
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
  "role": "user"
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
  "users": [
    {
      "uid": "user-id-1",
      "username": "user1",
      "email": "user1@example.com",
      "role": "user"
    },
    {
      "uid": "user-id-2",
      "username": "user2",
      "email": "user2@example.com",
      "role": "admin"
    }
  ]
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
  "uid": "user-id",
  "username": "username",
  "email": "user@example.com",
  "role": "user"
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
  "examId": "考試ID",
  "chapterNum": "章節編號",
  "options": ["選項A", "選項B", "選項C", "選項D"],
  "answer": "正確答案"
}
```

### 獲取所有問題

```http
GET /questions
```

**需要認證：** 是

### 獲取所有考試

```http
GET /questions/exams
```

**需要認證：** 是

### 獲取考試的所有問題

```http
GET /questions/exams/:examId
```

**需要認證：** 是

**參數**

- `examId`: 考試 ID

### 獲取隨機題目

```http
GET /questions/random
```

**需要認證：** 是

**查詢參數**
- `examIds`: 考試ID列表，以逗號分隔 (例如: exam1,exam2,exam3)
- `count`: 要獲取的題目數量 (預設: 1)

**回應範例**
```json
[
  {
    "id": "question-id-1",
    "examId": "exam-id-1",
    "content": "題目內容",
    "type": "SINGLE_CHOICE",
    "options": ["選項A", "選項B", "選項C", "選項D"]
  },
  {
    "id": "question-id-2",
    "examId": "exam-id-2",
    "content": "題目內容",
    "type": "MULTIPLE_CHOICE",
    "options": ["選項A", "選項B", "選項C", "選項D"]
  }
]
```

**說明**
- 從指定的考試中隨機選取題目
- 回傳的題目不包含答案
- 如果請求的題目數量超過可用題目總數，則返回所有可用題目

### 獲取特定考試的問題

```http
GET /questions/exam/:examId
```

**需要認證：** 是

**參數**

- `examId`: 考試 ID

### 獲取特定考試章節的問題

```http
GET /questions/exam/:examId/chapter/:chapterNum
```

**需要認證：** 是

**參數**

- `examId`: 考試 ID
- `chapterNum`: 章節編號

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

**請求體 (Request Body)**

```json
{
  "title": "新問題標題", // 可選
  "description": "新問題描述", // 可選
  "examId": "新考試ID", // 可選
  "chapterNum": "新章節編號", // 可選
  "options": ["新選項A", "新選項B", "新選項C", "新選項D"], // 可選
  "answer": "新正確答案" // 可選
}
```

### 刪除問題

```http
DELETE /questions/:id
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `id`: 問題 ID

### 為特定考試新增題目

```http
POST /questions/exam/:examId
```

**需要認證：** 是

**參數**

- `examId`: 考試 ID

**請求體 (Request Body)**

```json
{
  "title": "新題目標題",
  "description": "新題目描述",
  "options": ["新選項A", "新選項B", "新選項C", "新選項D"],
  "answer": "新正確答案"
}
```

### 獲取特定考試的所有題目

```http
GET /exams/:examId/questions
```

**需要認證：** 是

**參數**
- `examId`: 考試 ID

**回應範例**
```json
[
  {
    "id": "question-id-1",
    "question": "題目內容",
    "type": "SINGLE_CHOICE",
    "options": ["選項A", "選項B", "選項C", "選項D"],
    "correctAnswer": "正確答案",
    "score": 10,
    "chapterNum": "1",
    "chapterName": "第一章",
    "examId": "exam-id"
  }
]
```

### 提交考試結果

```http
POST /questions/exam-results
```

**需要認證：** 是

**請求體 (Request Body)**
```json
{
  "answers": [
    {
      "questionId": "題目ID",
      "answer": ["使用者的答案"]
    }
  ],
  "timeSpent": 300
}
```

**回應範例**
```json
{
  "questions": [
    {
      "id": "題目ID",
      "examId": "考試ID",
      "content": "題目內容",
      "type": "題目類型",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "correctAnswer": ["正確答案"],
      "userAnswer": ["使用者答案"],
      "isCorrect": true
    }
  ],
  "summary": {
    "totalQuestions": 1,
    "correctCount": 1,
    "accuracy": 1.0,
    "timeSpent": 300
  }
}
```

**說明**
- 系統會檢查每個題目的答案是否正確
- 多選題的答案順序不重要
- 回傳的結果包含每題的詳細資訊和整體統計

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
  "byExam": {
    "exam1": {
      "answered": 50,
      "correct": 40,
      "accuracy": 0.8
    }
  }
}
```

### 獲取特定記錄

```http
GET /records/:id
```

**需要認證：** 是

**參數**

- `id`: 記錄 ID（只能查看自己的記錄，除非是管理員）

### 更新記錄

```http
PATCH /records/:id
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `id`: 記錄 ID

**請求體 (Request Body)**

```json
{
  "answer": "新答案", // 可選
  "timeSpent": 40 // 可選
}
```

### 刪除記錄

```http
DELETE /records/:id
```

**需要認證：** 是
**需要權限：** admin

**參數**

- `id`: 記錄 ID

## 通用信息

### 錯誤響應

```json
{
  "statusCode": 400/401/403/404/500,
  "message": "錯誤信息",
  "error": "錯誤類型"
}
```

### 認證

除了登入和註冊端點外，所有請求都需要在 Header 中包含 Bearer Token：

```
Authorization: Bearer your-jwt-token
```

### 權限

- **user**: 基本用戶權限
- **admin**: 管理員權限
