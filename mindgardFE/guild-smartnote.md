Dưới đây là **thiết kế tính năng Smart Note dành riêng cho MindGard Extension** (phù hợp với extension tăng tập trung mà bạn đang làm). Mục tiêu là **ghi chú nhanh nhưng không làm người dùng mất focus**.

---

# Thiết kế tính năng: Smart Note cho MindGard Extension

## 1. Mục tiêu

Smart Note giúp người dùng:

* Ghi chú **nhanh trong lúc làm việc**
* Không cần mở app note khác
* Hỗ trợ **AI tóm tắt & organize**
* Lưu lại **ý tưởng khi đang tập trung**

Triết lý:

> **Capture thought → Continue focus**

---

# 2. Use Case chính

### 1️⃣ Quick Note khi đang làm việc

Người dùng:

* đang xem video
* đang đọc tài liệu
* đang coding

→ có ý tưởng

→ **Ctrl + Shift + N**

Popup note nhỏ xuất hiện.

---

### 2️⃣ Note khi xem YouTube / học online

Người dùng:

* xem YouTube
* xem course

→ click **Add Note**

MindGard tự lưu:

* video title
* timestamp

Ví dụ:

```
React Query caching explained
Timestamp: 04:21
Note: staleTime = tránh refetch
```

---

### 3️⃣ Capture text từ website

User **highlight text**

→ right click

```
Add to MindGard Note
```

Extension sẽ lưu:

```
Quote
URL
Title
```

---

# 3. UI Design

## 3.1 Quick Note Popup

Popup nhỏ (không chiếm màn hình)

```
------------------------
MindGard Quick Note
------------------------

Title (optional)

[ content textarea ]

Tags: auto

[ Save ] [ Cancel ]
```

UX:

* auto focus textarea
* Enter = save

---

## 3.2 Floating Note Button

Góc màn hình

```
🧠
```

Click → mở note panel

---

## 3.3 Note Panel (Side panel)

```
--------------------------------
MindGard Notes
--------------------------------

Search notes...

React Query
Summary: caching logic
Tags: react, study

Docker commands
Summary: docker logs

--------------------------------
```

---

# 4. Smart Features (AI)

## 4.1 Auto Summary

User viết:

```
React Query caching tránh refetch nhiều lần
staleTime quyết định khi nào data stale
retry giúp retry khi request fail
```

AI generate:

```
Summary:
React Query caching, staleTime, retry logic
```

---

## 4.2 Auto Tag

AI gợi ý tag

```
Tags:
React
Frontend
Learning
```

---

## 4.3 Smart Link Detection

Nếu note chứa:

```
youtube.com
github.com
docs
```

→ tự classify

```
Video
Code
Documentation
```

---

# 5. Database Schema

### Note

```
Note
```

```
id
userId
title
content
summary
tags
url
timestamp
createdAt
updatedAt
```

---

# 6. Extension Architecture

```
Chrome Extension
│
├── Popup (React)
│
├── Content Script
│   └ highlight text
│
├── Background Service Worker
│   └ save notes
│
└── Storage
    └ chrome.storage.local
```

---

# 7. Data Flow

### Create Note

```
User highlight text
      ↓
Content Script
      ↓
Send message
      ↓
Background
      ↓
Save storage
      ↓
Run AI summary
```

---

# 8. Storage Strategy

### Option 1 (dễ nhất)

```
chrome.storage.local
```

Ưu điểm:

* offline
* nhanh

---

### Option 2

Backend API

```
POST /notes
GET /notes
```

→ sync nhiều device.

---

# 9. Keyboard Shortcut

```
Ctrl + Shift + N
```

Open quick note.

---

# 10. Smart Feature nâng cao (rất hợp MindGard)

## Focus Reminder

Nếu user note:

```
Need to finish report today
```

AI detect:

```
task
deadline
```

→ MindGard reminder.

---

## Idea Capture Mode

Nếu user viết:

```
startup idea
```

AI tag:

```
Idea
```

---

# 11. Feature cực mạnh (nếu làm)

## Auto Note từ YouTube

MindGard:

```
Get current video
Get timestamp
```

Note:

```
Title: React Query course
Timestamp: 12:31
Note: cache explanation
```

API:

```
document.querySelector('video').currentTime
```

---

# 12. Future Features

### 🔥 Knowledge Graph

Note link với nhau

```
React Query
   ↓
Caching
   ↓
Tanstack
```

---

### 🔥 AI Rewrite Note

AI biến note lộn xộn thành:

```
Structured knowledge
```

---

### 🔥 Daily Note

MindGard tự tạo:

```
Daily Focus Log
```

---

# 13. Tại sao feature này hợp MindGard

MindGard = **Focus tool**

Focus problem:

```
Idea xuất hiện → mở Notion → mất focus
```

Smart Note giải quyết:

```
Idea → Quick capture → Continue focus
```

---

# 14. Nếu làm đúng cách

Feature này có thể trở thành **USP của MindGard**.

Giống:

* Notion AI
* Obsidian
* Mem.ai

nhưng:

> **Focus-first note system**

---

💡 Nếu bạn muốn, tôi có thể viết tiếp cho bạn:

* **Architecture chuẩn cho extension (rất quan trọng với MV3)**
* **Cách lưu note + sync backend**
* **Cách lấy timestamp YouTube trong extension**
* **Thiết kế feature này để Chrome Store duyệt dễ hơn**
* **UI/UX chuẩn để extension nhìn không “phèn AI”** (cái này rất quan trọng với sản phẩm).
