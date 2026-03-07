# Bank Transaction System - UI Components

## 🎨 Scalable UI Components

This project features a modern, scalable UI built with Next.js, TypeScript, and Tailwind CSS.

### Components Created

#### 1. **HeaderBox** (`components/ui/HeaderBox.tsx`)
- Displays personalized greetings with gradient text
- Supports both title and greeting modes
- Fully typed with TypeScript

#### 2. **TotalBalanceBox** (`components/TotalBalanceBox.tsx`)
- Shows total balance across all accounts
- Displays number of linked bank accounts
- Includes placeholder for doughnut chart
- Gradient background with glassmorphism effect

#### 3. **BankCard** (`components/ui/BankCard.tsx`)
- Beautiful gradient card design
- Shows account details and balance
- Hover animations for better UX
- Masked account numbers for security

#### 4. **RecentTransactions** (`components/ui/RecentTransactions.tsx`)
- Lists recent transactions with icons
- Color-coded debit (red) and credit (green)
- Shows transaction category and date
- Empty state with illustration

#### 5. **StatsCard** (`components/ui/StatsCard.tsx`)
- Displays key metrics
- Shows percentage changes
- Custom icons for each stat
- Color-coded positive/negative trends

### Features

✅ **Responsive Design** - Works on mobile, tablet, and desktop
✅ **Modern Gradients** - Blue to cyan gradient themes
✅ **Smooth Animations** - Hover effects and transitions
✅ **TypeScript** - Fully typed for better DX
✅ **Scalable Architecture** - Easy to extend and maintain
✅ **Accessible** - Semantic HTML and ARIA support

### Layout Sections

1. **Header Section**
   - Welcome greeting
   - Total balance overview

2. **Stats Dashboard**
   - Total Income
   - Total Expenses
   - Transaction Count
   - Savings Rate

3. **Bank Accounts**
   - Scrollable card list
   - Add new account button

4. **Recent Transactions**
   - Transaction list with details
   - View all button

5. **Quick Actions**
   - Add Transaction
   - View Reports
   - Settings

### Styling

All custom styles are in `app/globals.css`:
- Custom utility classes
- Consistent color scheme
- Reusable components
- Custom scrollbar styles
- Animation keyframes

### Color Palette

- **Primary**: Blue-600 to Cyan-500 gradient
- **Background**: White with subtle shadows
- **Text**: Gray-900 for headings, Gray-600 for subtext
- **Success**: Green-600
- **Error**: Red-600
- **Warning**: Yellow-500
- **Info**: Purple-600

### Usage Example

```tsx
import HeaderBox from "@/components/ui/HeaderBox";
import BankCard from "@/components/ui/BankCard";
import StatsCard from "@/components/ui/StatsCard";

<HeaderBox
  type="greeting"
  title="Welcome"
  user="John"
  subtext="Manage your finances"
/>

<BankCard
  account={{
    name: "Chase Checking",
    currentBalance: 5420.50,
    mask: "1234"
  }}
  userName="John Doe"
/>

<StatsCard
  label="Total Income"
  value="$3,500.00"
  change={{ value: 12.5, isPositive: true }}
/>
```

### Utilities (`lib/utils.ts`)

- `formatAmount(amount)` - Formats numbers as currency
- `formatDateTime(date)` - Formats dates in multiple formats
- `cn()` - Merges Tailwind classes
- `parseStringify()` - Deep clones objects
- Plus more helper functions

### Future Enhancements

- [ ] Add real chart library (Chart.js or Recharts)
- [ ] Implement dark mode toggle
- [ ] Add data fetching with React Query
- [ ] Add loading skeletons
- [ ] Implement search and filters
- [ ] Add pagination for transactions
- [ ] Export to CSV functionality
- [ ] Multi-currency support

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

Built with ❤️ using Next.js 15, TypeScript, and Tailwind CSS
