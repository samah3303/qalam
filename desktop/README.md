# Qalam (قلم)

**Modern Accounting Software for Small to Medium Businesses**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Overview

**Qalam** (meaning "pen" in Arabic) is a comprehensive offline-first accounting solution built specifically for small and medium businesses in the UAE and Gulf region. With support for VAT compliance, multi-currency, and Arabic/English languages, Qalam makes financial management simple and efficient.

## ✨ Features

### Phase 1 - Core Accounting ✅

- 📊 **Dashboard** - Real-time financial overview
- 🧾 **Invoicing** - Create, manage, and track invoices
- 💰 **Expense Tracking** - Categorize and monitor expenses
- 📈 **Financial Reports** - P&L, Balance Sheet, Trial Balance
- 👤 **User Authentication** - Secure local authentication

### Phase 2 - Enhanced Features ✅

- 👥 **Customer Management** - Complete CRM with balances & history
- 📦 **Inventory Management** - Product catalog with stock tracking
- 📊 **Enhanced Reporting** - Cash Flow, Aged Receivables, VAT Reports
- 🔍 **Advanced Search** - Filter and find records quickly

### Coming Soon 🚀

- ☁️ Cloud Sync - Backup and sync across devices
- 📱 Mobile App - iOS & Android support
- 🌐 Multi-user - Team collaboration features
- 🔗 Integrations - Banking, payment gateways

---

## 🛠️ Technology Stack

**Frontend:**

- Vue 3 (Composition API)
- TypeScript
- Vite

**Backend:**

- Electron
- SQLite (better-sqlite3)
- Node.js

**Key Features:**

- Offline-first architecture
- Local data storage
- Fast performance
- Cross-platform ready

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd qalam/desktop

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package as installer
npm run package
```

---

## 📖 Usage

### First Launch

1. Create your admin account
2. Set up company profile
3. Configure VAT settings (if applicable)
4. Start creating invoices!

### Key Workflows

- **Create Invoice:** Customers → New Invoice → Add Line Items → Save
- **Track Expense:** Expenses → Add Expense → Select Category
- **View Reports:** Reports → Select Report Type → Choose Date Range

---

## 🏗️ Project Structure

```
qalam/
├── desktop/              # Electron desktop app
│   ├── electron/         # Main process files
│   │   ├── services/     # Business logic
│   │   ├── database/     # Database service
│   │   └── main.ts       # Entry point
│   ├── src/              # Renderer process (Vue)
│   │   ├── components/   # Vue components
│   │   ├── types/        # TypeScript types
│   │   └── App.vue       # Main app component
│   └── package.json
```

---

## 🔒 Security & Privacy

- ✅ All data stored locally
- ✅ No cloud dependencies (offline-first)
- ✅ Encrypted database (optional)
- ✅ Regular backups recommended

---

## 📊 Reports Available

1. **Profit & Loss Statement** - Revenue vs Expenses
2. **Balance Sheet** - Assets, Liabilities, Equity
3. **Cash Flow Statement** - Operating, Investing, Financing
4. **Aged Receivables** - Outstanding invoices by age
5. **VAT Report** - Tax collected and paid
6. **Trial Balance** - Account balances verification

---

## 🌍 Localization

- 🇬🇧 English (Default)
- 🇦🇪 Arabic (Coming Soon)

Currency: AED (UAE Dirham) with multi-currency support

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 💬 Support

For issues, questions, or feature requests:

- 📧 Email: support@qalam.app
- 🐛 GitHub Issues: [Report a bug](https://github.com/yourusername/qalam/issues)

---

## 🎯 Roadmap

**Q1 2025**

- [ ] Mobile apps (iOS & Android)
- [ ] Cloud sync infrastructure
- [ ] Arabic language support

**Q2 2025**

- [ ] Multi-user support
- [ ] Banking integrations
- [ ] Advanced analytics

**Q3 2025**

- [ ] API for third-party integrations
- [ ] Automated backups
- [ ] Custom report builder

---

## ⭐ Acknowledgments

Built with modern technologies for the modern business owner.

**Qalam** - Making accounting simple, one entry at a time. ✒️

---

_Made with ❤️ for small businesses_
