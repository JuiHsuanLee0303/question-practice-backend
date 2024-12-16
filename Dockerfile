# 使用 Node.js 基礎映像
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製專案檔案到容器中
COPY . .

# 編譯 NestJS 應用
RUN npm run build

# 設定環境變數
ENV PORT=3000

# 暴露容器的埠
EXPOSE 3000

# 啟動 NestJS 應用
CMD ["npm", "run", "start:prod"]

