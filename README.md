# WorkForge HR

**Employee Management, Refined.**

A full-stack, role-based enterprise employee management system featuring secure authentication, role-based access control, real-time dashboards, employee lifecycle management, attendance tracking, and INR-based payroll logic. Built with Django REST Framework and React, designed for modern cloud deployment with production-grade UI and scalable architecture.

![WorkForge HR](https://img.shields.io/badge/WorkForge-HR-blue)
![Django](https://img.shields.io/badge/Django-5.2.8-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Overview

WorkForge HR is a comprehensive Human Resources Management System (HRMS) designed for modern organizations. It provides a complete solution for managing employees, teams, attendance, and payroll with role-based access control and a beautiful, intuitive interface.

### Key Features

- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control
- 👥 **Employee Management** - Complete CRUD operations with search, filter, and pagination
- 🏢 **Team & Department Management** - Organize employees into teams with manager assignments
- 🕒 **Attendance Tracking** - Daily attendance marking with monthly views and admin override
- 💰 **Payroll Management** - INR-based payroll calculations with automatic deductions and bonuses
- 📊 **Real-time Dashboard** - KPI cards, activity feeds, and quick actions
- 🎨 **Modern UI/UX** - Professional SaaS design with responsive layout
- 🔒 **Role-Based Permissions** - Admin, Manager, and Employee roles with granular access control

## 🛠️ Tech Stack

### Backend
- **Django 5.2.8** - High-level Python web framework
- **Django REST Framework** - Powerful toolkit for building Web APIs
- **JWT Authentication** - Secure token-based authentication
- **SQLite** (Development) / **PostgreSQL** (Production) - Database
- **CORS Headers** - Cross-origin resource sharing support

### Frontend
- **React 18.3.1** - Modern JavaScript library for building user interfaces
- **React Router DOM** - Declarative routing for React
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - Promise-based HTTP client
- **Lucide React** - Beautiful icon library

## 📁 Project Structure

```
Task-Management-System/
├── backend/
│   ├── accounts/          # User authentication and management
│   ├── employees/         # HR models (EmployeeProfile, Team, Attendance, Payroll)
│   ├── tasks/             # Task management module
│   ├── core/              # Django settings and configuration
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── layout/   # Layout components (Sidebar, Topbar)
│   │   │   └── ui/       # UI primitives (Card, Button, Modal, etc.)
│   │   ├── pages/        # Page components
│   │   ├── contexts/      # React contexts (Auth, Toast)
│   │   ├── services/     # API service layer
│   │   └── App.js        # Main application component
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+ 
- Node.js 16+ and npm
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser** (optional)
   ```bash
   python manage.py createsuperuser
   ```

6. **Seed demo data** (optional)
   ```bash
   python manage.py seed
   # OR for production deployment:
   python manage.py create_demo_users
   ```
   This creates demo users:
   - Admin: `admin@example.com` / `admin123`
   - Manager: `manager@example.com` / `manager123`
   - User: `user@example.com` / `user123`

7. **Start development server**
   ```bash
   python manage.py runserver
   ```
   Backend will run on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file** (optional)
   ```bash
   # Create .env file
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 🔐 Authentication & Roles

### User Roles

- **Admin** - Full system access
  - Manage all employees, teams, and users
  - Create and process payroll
  - Override attendance records
  - System settings access

- **Manager** - Team management
  - View and manage team members
  - Mark attendance for team
  - View team payroll
  - Create tasks for team

- **Employee** - Self-service
  - View own profile
  - Mark own attendance
  - View own tasks
  - View own payroll

### API Endpoints

#### Authentication
- `POST /api/token/` - Login (returns JWT tokens)
- `POST /api/token/refresh/` - Refresh access token
- `POST /api/accounts/signup/` - User registration

#### Employees
- `GET /api/employees/` - List employees (with filters)
- `POST /api/employees/` - Create employee (Admin only)
- `GET /api/employees/:id/` - Get employee details
- `PATCH /api/employees/:id/` - Update employee
- `DELETE /api/employees/:id/` - Delete employee

#### Teams
- `GET /api/teams/` - List teams
- `POST /api/teams/` - Create team
- `GET /api/teams/:id/` - Get team details
- `PUT /api/teams/:id/` - Update team
- `DELETE /api/teams/:id/` - Delete team

#### Attendance
- `GET /api/attendance/` - List attendance records
- `POST /api/attendance/` - Mark attendance
- `GET /api/attendance/:id/` - Get attendance record
- `PATCH /api/attendance/:id/` - Update attendance
- `DELETE /api/attendance/:id/` - Delete attendance

#### Payroll
- `GET /api/payroll/` - List payroll records
- `POST /api/payroll/` - Create payroll (Admin only)
- `GET /api/payroll/:id/` - Get payroll details
- `PATCH /api/payroll/:id/` - Update payroll
- `DELETE /api/payroll/:id/` - Delete payroll

#### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics

## 💰 Currency & Localization

All monetary values are displayed in **Indian Rupees (INR)** with proper formatting:
- Base salary: ₹50,000
- Deductions: ₹2,500
- Final pay: ₹47,500

The system uses `Intl.NumberFormat` for consistent currency formatting across the application.

## 🎨 UI Components

WorkForge HR uses a consistent design system with reusable components:

- **Card** - Container component with hover effects
- **Button** - Multiple variants (primary, secondary, outline, danger)
- **Badge** - Status indicators with color variants
- **Modal** - Dialog component for forms and confirmations
- **Input** - Form inputs with validation
- **Select** - Dropdown selects
- **Table** - Data tables with sorting
- **LoadingSpinner** - Loading states
- **EmptyState** - Empty state placeholders

## 🔒 Security Features

- JWT token-based authentication
- Role-based access control (RBAC)
- Protected API endpoints
- CORS configuration
- Password hashing (Django's PBKDF2)
- Input validation and sanitization

## 📊 Dashboard Features

The dashboard provides real-time insights:

- **Total Employees** - Count of active employees
- **Present Today** - Employees marked present today
- **On Leave** - Employees on leave today
- **Pending Tasks** - Tasks not yet completed
- **Recent Employees** - Latest additions
- **Recent Tasks** - Latest task activity

## 🚢 Deployment

### Backend (Render / Railway / Heroku)

1. Set environment variables:
   ```
   SECRET_KEY=your-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://...
   ALLOWED_HOSTS=your-domain.com
   ```

2. Update `settings.py` for production:
   - Set `DEBUG = False`
   - Configure database
   - Set up static files
   - Configure CORS allowed origins

3. **Create demo users automatically during deployment:**
   
   **Option A: Add to build command (Render)**
   ```
   python manage.py migrate && python manage.py create_demo_users && gunicorn core.wsgi:application
   ```
   
   **Option B: Add as release command in Procfile**
   ```
   release: python manage.py migrate --noinput && python manage.py create_demo_users
   web: gunicorn core.wsgi:application
   ```
   
   **Option C: Run manually after deployment**
   ```bash
   python manage.py create_demo_users
   ```

4. Deploy using your platform's instructions

### Frontend (Vercel / Netlify)

1. Set environment variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

2. Build and deploy:
   ```bash
   npm run build
   ```

3. Deploy the `build` folder to your hosting platform

## 📝 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📸 Screenshots

*Add screenshots of your application here*

- Dashboard view
- Employee management
- Attendance tracking
- Payroll management
- Team overview

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Django REST Framework team
- React team
- Tailwind CSS team
- All open-source contributors


---

**WorkForge HR** - Employee Management, Refined. 🚀
