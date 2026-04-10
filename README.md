# 🚀 ToiZero Remote Panel

**ToiZero Remote Panel** คือเครื่องมือช่วยจัดการและทำโจทย์สำหรับการเตรียมความพร้อมค่ายคอมพิวเตอร์โอลิมปิก (TOI) โดยเชื่อมต่อกับระบบ [TOI Coding](https://toi-coding.informatics.buu.ac.th/) เพื่อมอบประสบการณ์การทำโจทย์ที่ลื่นไหล ทันสมัย และมีประสิทธิภาพมากขึ้น

---

## ✨ คุณสมบัติเด่น (Features)

*   **⚡ Modern Dashboard**: อินเตอร์เฟซที่สวยงาม ใช้งานง่าย พร้อมระบบคำนวณ Progress และคะแนนสะสมแบบเรียลไทม์
*   **📂 Smart PDF Viewer**: 
    *   ใช้ Native Browser Engine เพื่อความลื่นไหลในการซูมและค้นหาคำ
    *   รองรับการเลือกและคัดลอกข้อความเป็นข้อความ (Text Selection)
    *   ระบบ **Persistent State**: จดจำหน้าที่อ่านค้างไว้และระดับการซูมแยกตามรายข้อ
    *   **Auto Discovery**: ระบบค้นหาไฟล์ PDF อัตโนมัติ (รองรับ Pattern หลากหลายเช่น `_R1`, `_R2`)
*   **🔍 Task Management**:
    *   ระบบกรองโจทย์ (Solved / Unsolved) และระบบค้นหาที่รวดเร็ว
    *   ดึงข้อมูลคะแนนและรายละเอียดโจทย์จากระบบ TOI โดยตรง
*   **🛡️ Secure Authentication**: จัดการ Session และ CSRF Token อัตโนมัติ พร้อมระบบ Logging เพื่อการตรวจสอบที่ละเอียด
*   **⏰ Persistent Workspace**: กลับมาใช้งานต่อได้ทันทีโดยไม่ต้องตั้งค่าใหม่ ระบบจะจำว่าคุณค้างอยู่ที่โจทย์ข้อไหน
*   **🕒 Hybrid Timing**: มีนาฬิกาบอกเวลาปัจจุบันและเวลาที่อัปเดตข้อมูลล่าสุดบน Top Bar

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **React + Vite**: เพื่อความเร็วในการโหลดและการพัฒนาที่ทันสมัย
- **Tailwind CSS**: การออกแบบที่ยืดหยุ่นและสวยงามสไตล์ Modern UI
- **Zustand**: ระบบจัดการ State ที่เบาและมีประสิทธิภาพ พร้อมระบบ Persistence
- **Lucide React**: ชุดไอคอนสวยงามสไตล์ Minimal

### Backend
- **TypeScript + Bunny/Express**: เซิร์ฟเวอร์ที่รวดเร็วและปลอดภัย
- **Cheerio**: ระบบ Parsing ข้อมูลจากหน้าเว็บ TOI ที่แม่นยำ
- **Axios**: จัดการ HTTP Request พร้อมระบบ Proxy และ Retry

---

## 🚀 การเริ่มต้นใช้งาน (Getting Started)

### 1. การติดตั้ง (Installation)
```bash
# ติดตั้ง dependencies ทั้ง frontend และ backend
npm install
```

### 2. การตั้งค่า (Configuration)
สร้างไฟล์ `.env` ในโฟลเดอร์ `backend` และตั้งค่าดังนี้:
```env
PORT=3001
TOI_LOCAL_PATH=/path/to/your/pdf/folder
```

### 3. รันโปรเจกต์ (Running)
```bash
# เริ่มต้นใช้งาน (Development Mode)
npm run dev
```

แอปพลิเคชันจะเปิดขึ้นที่ `http://localhost:5173`

---

## 📖 วิธีการใช้งาน

1.  **Login**: ใส่บัญชีผู้ใช้เดียวกับระบบ TOI Coding
2.  **Navigation**: เลือกโจทย์จากแถบ Sidebar ด้านซ้าย
3.  **Viewing**: อ่านโจทย์ผ่าน PDF Viewer ด้านขวา (ระบบจะจดจำตำแหน่งที่คุณเลื่อนอ่านไว้เสมอ)
4.  **Submission**: เขียนโค้ดและส่งงานผ่านหน้าจัดการที่เตรียมไว้ให้ (Coming Soon)

---

## 📝 บันทึกการพัฒนา (Recent Updates)
- [2026-04-10] อัปเกรด PDF Viewer เป็น Native Browser Engine เพื่อรองรับการค้นหาและคัดลอกข้อความ
- [2026-04-10] เพิ่มระบบ Persistence จดจำสถานะหน้ากระดาษและซูมรายข้อ
- [2026-04-10] เพิ่มระบบ Auto-fit width สำหรับ PDF สเกลอัตโนมัติให้พอดีขอบจอ

---

**Happy Coding!** 💻🏆
