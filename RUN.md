# 🚀 How to Run — PassPhoto-Studio-AI-Passport-Maker

This guide provides one-click and step-by-step instructions to run **PassPhoto-Studio-AI-Passport-Maker** locally on your machine.

---

## ⚡ Option 1: 1-Click Instant Run (Windows)

Simply double-click the **`run.bat`** file inside this folder!

It automatically:
1. Checks for Node.js in your system PATH.
2. Installs all dependencies (`npm install`) if `node_modules` is missing.
3. Opens [`http://localhost:3000`](http://localhost:3000) in your default web browser.
4. Boots up the Next.js development server.

---

## 🛠️ Option 2: Manual Terminal Execution

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Step-by-Step Commands

1. **Open your terminal in this folder**:
   ```bash
   cd "PassPhoto-Studio-AI-Passport-Maker"
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🌐 Local Configuration & Ports

| Property | Value |
| :--- | :--- |
| **Local URL** | `http://localhost:3000` |
| **Framework Engine** | Next.js (App Router / Turbopack) |
| **Stop Server** | Press `Ctrl + C` in the running terminal |

---

## ❓ Troubleshooting

- **Port 3000 already in use?**
  Next.js will automatically prompt to run on `http://localhost:3001` or you can terminate the conflicting process:
  ```powershell
  # Windows PowerShell:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
- **Dependencies error?**
  Delete `node_modules` and re-install:
  ```bash
  rmdir /s /q node_modules
  npm install
  ```
