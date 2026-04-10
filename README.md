# 🚀 ToiZero Panel: The Professional Olympiad Toolkit

ToiZero Panel เป็นระบบบริหารจัดการและส่งข้อสอบระดับโอลิมปิกวิชาการ (TOI/POSN) ที่ออกแบบมาเพื่อเปลี่ยนประสบการณ์การแก้โจทย์ให้ลื่นไหลและทรงพลังที่สุด ด้วยการเชื่อมต่อระหว่าง **Web Dashboard** และ **VSCode Extension** แบบไร้รอยต่อ

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ คุณสมบัติเด่น (Features)

### 🖥️ 1. Snappy Web Dashboard
- **Real-time Scoring**: แสดงคะแนนโจทย์ทุข้อ พร้อมระบบ Auto-refresh ที่ Snappy ที่สุด
- **Task Analytics**: สรุปความคืบหน้า (Progress Bar) และสถิติคะแนนรวม
- **Deep Syncing**: ล็อกอินที่เว็บ แล้วใช้ที่อื่นได้ทันทีแม่รีสตาร์ทเครื่อง

### 🧩 2. ToiZero VSCode Extension
- **Folder Decoration**: ลงสีโจทย์ตามคะแนน (🟢 เต็ม / 🟡 พยายามแล้ว / 🔴 0 หรือยังส่ง)
- **1-Click Submit**: ปุ่มกดส่งงานที่ Status Bar ไม่ต้องสลับหน้าจอไปมา
- **Badge Status**: แสดงคะแนนห้อยท้ายชื่อโจทย์ใน Explorer ทันที

### 📂 3. Smart Localization
- **Shared Session**: ระบบซิงก์ Session ผ่านไฟล์ลับเครื่องตัวเอง คุยกันได้ทั้งบ้าน (Frontend, Backend, Extension)
- **Auto-polling**: ตรวจจับสถานะการตรวจคะแนนอัตโนมัติ ไม่ต้องกด F5

---

## 🏗️ โครงสร้างโปรเจกต์ (Project Structure)

- `backend/`: ระบบ Node.js API (Port 3001) ทำหน้าที่เชื่อม CMS และจัดการ Session
- `frontend/`: อินเตอร์เฟซ React สุดพรีเมียม (Vite)
- `vscode-ext/`: ส่วนขยายสำหรับ VSCode เพื่อ Workflow ระดับเทพ

---

## 🚀 เริ่มต้นใช้งาน (Quick Start)

### 1. รันระบบหลัก (Backend & Frontend)
```bash
# Start Backend (Port 3001)
cd backend
npm install
npm run dev

# Start Frontend (Port 5173)
cd ../frontend
npm install
npm run dev
```

### 2. ติดตั้ง VSCode Extension
1. เข้าไปที่โฟลเดอร์ `vscode-ext`
2. ติดตั้งไฟล์ `toizero-ext-0.0.1.vsix` ผ่านเมนู **"Install from VSIX..."** ใน VSCode
3. กดรันคำสั่ง `ToiZero: Sync Login` ใน VSCode

---

## 🛠️ การตั้งค่า (Configuration)
สร้างและแก้ไขไฟล์ `.env` ในโฟลเดอร์ `backend`:
```env
PORT=3001
TOI_LOCAL_PATH=/path/to/your/TOI-Tasks # โฟลเดอร์ที่เก็บโจทย์โจทย์
CMS_URL=https://cms.toi.com # URL ของระบบ CMS
```

---

## 🤝 ร่วมพัฒนา (Contributing)
หากพี่มีความคิดสร้างสรรค์อยากพ่นไฟเพิ่ม สามารถ Fork และส่ง Pull Request มาได้เสมอครับ! ขิงกันได้เต็มที่ 555

Made with ❤️ by Kimyobu & Antigravity AI
