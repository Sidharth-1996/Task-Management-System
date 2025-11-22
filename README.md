# Role-Based Task Management System

A full-stack web application built with React (frontend) and Django REST Framework (backend) that implements a comprehensive role-based authentication system for managing tasks. The application allows users with different roles (Admin, Manager, User) to have different levels of access and functionality.

## Features

### 🔐 Authentication & Authorization
- JWT (JSON Web Token) based authentication
- Password hashing using Django's PBKDF2 (bcrypt-compatible)
- Role-based authorization for protected routes
- Public routes: `/login`, `/signup`
- Private routes: Task management and user management (based on role)

### 👥 Roles & Permissions

#### Admin
- Create, edit, delete, and assign tasks
- Manage user accounts (CRUD operations)
- View all tasks across the system
- Full access to all features

#### Manager
- Create and assign tasks to users
- View and update tasks for their team
- Cannot delete users or manage user accounts

#### User
- View and update only their own assigned tasks
- Change task status (To Do, In Progress, Completed)
- Cannot create, delete, or assign tasks

### 📋 Task Management
- Create, read, update, and delete tasks
- Task fields: Title, Description, Status, Assigned To, Created By, Due Date
- Task status: To Do, In Progress, Completed
- Search and filter functionality
- Pagination support
- Role-based task filtering

### 📅 Calendar Functionality
- FullCalendar integration with month, week, and day views
- Tasks displayed on their respective due dates
- Click on dates to view all tasks scheduled for that day
- Color-coded tasks based on status
- Role-based access (Admins see all tasks, Managers see team tasks, Users see only their tasks)

### 👤 User Management (Admin Only)
- Create, read, update, and delete users
- Assign roles to users
- Manage user information

## Tech Stack

### Backend
- **Django 5.2.8** - Web framework
- **Django REST Framework 3.16.1** - REST API framework
- **djangorestframework-simplejwt 5.5.1** - JWT authentication
- **django-cors-headers 4.9.0** - CORS handling
- **python-dotenv 1.0.1** - Environment variables
- **SQLite** - Database (default, can be changed to PostgreSQL)

### Frontend
- **React 18.3.1** - UI library
- **React Router DOM 6.28.0** - Routing
- **Axios 1.7.7** - HTTP client
- **Tailwind CSS 3.4.1** - Styling
- **FullCalendar 6.1.15** - Calendar component
- **Lucide React** - Icons

## Project Structure

```
Role-Based Task Management System/
├── backend/                 # Django backend
│   ├── accounts/           # User authentication app
│   │   ├── models.py       # User model
│   │   ├── views.py        # Authentication views
│   │   ├── serializers.py  # User serializers
│   │   └── urls.py         # Account URLs
│   ├── tasks/              # Task management app
│   │   ├── models.py       # Task model
│   │   ├── views.py        # Task views
│   │   ├── serializers.py  # Task serializers
│   │   ├── permissions.py  # Role-based permissions
│   │   └── urls.py         # Task URLs
│   ├── core/               # Django project settings
│   │   ├── settings.py     # Django settings
│   │   └── urls.py         # Main URL configuration
│   ├── manage.py           # Django management script
│   └── requirements.txt     # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js
│   │   │   ├── TaskList.js
│   │   │   ├── TaskModal.js
│   │   │   ├── CalendarView.js
│   │   │   ├── UserManagement.js
│   │   │   └── UserModal.js
│   │   ├── contexts/       # React contexts
│   │   │   └── AuthContext.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.js          # Main App component
│   │   └── index.js        # Entry point
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── README.md               # This file
```

## Setup Instructions

### Prerequisites
- **Python 3.8+** installed ([Download Python](https://www.python.org/downloads/))
- **Node.js 16+** and npm installed ([Download Node.js](https://nodejs.org/))
- **Git** (optional, for cloning the repository)
- **Code Editor** (VS Code, PyCharm, etc.)

---

## Quick Start Guide

### Step 1: Clone or Download the Project
```bash
# If using Git
git clone <repository-url>
cd "Role-Based Task Management System"

# Or download and extract the project folder
```

### Step 2: Backend Setup

1. **Open a terminal/command prompt and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment (recommended):**
   
   **Windows:**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
   
   **macOS/Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
   
   You should see `(venv)` in your terminal prompt when activated.

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   This will install:
   - Django 5.2.8
   - Django REST Framework 3.16.1
   - djangorestframework-simplejwt 5.5.1
   - django-cors-headers 4.9.0
   - python-dotenv 1.0.1
   - bcrypt 4.2.0
   - And other required packages

4. **Run database migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
   
   This creates the database tables for users and tasks.

5. **Seed the database with sample users:**
   ```bash
   python manage.py seed
   ```
   
   This creates three sample users (Admin, Manager, User) with the credentials listed below.

6. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   
   The backend server will start at **http://localhost:8000**
   
   You should see output like:
   ```
   Starting development server at http://127.0.0.1:8000/
   Quit the server with CTRL-BREAK.
   ```
   
   **Keep this terminal window open** - the backend server must be running for the frontend to work.

### Step 3: Frontend Setup

1. **Open a NEW terminal/command prompt window** (keep the backend server running in the first terminal)

2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
   
   (If you're in the project root, use: `cd "Role-Based Task Management System/frontend"`)

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
   
   This will install:
   - React 18.3.1
   - React Router DOM 6.28.0
   - Axios 1.7.7
   - Tailwind CSS 3.4.1
   - FullCalendar 6.1.15
   - And other required packages
   
   This may take a few minutes.

4. **Create environment file (optional but recommended):**
   
   Create a file named `.env` in the `frontend` directory with the following content:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   ```
   
   This tells the frontend where to find the backend API.

5. **Start the React development server:**
   ```bash
   npm start
   ```
   
   The frontend will start at **http://localhost:3000**
   
   Your browser should automatically open. If not, navigate to `http://localhost:3000` manually.

### Step 4: Access the Application

1. **Open your web browser** and go to: `http://localhost:3000`

2. **You should see the login page**

3. **Use one of the sample credentials below to login**

---

## Sample Credentials

After running `python manage.py seed`, you can use these credentials to login:

### 🔴 Admin Account
- **Email/Username:** `admin@example.com` or `admin`
- **Password:** `admin123`
- **Role:** Admin
- **Permissions:**
  - ✅ Create, edit, delete, and assign tasks
  - ✅ Manage user accounts (create, edit, delete users)
  - ✅ View all tasks across the system
  - ✅ Assign users to managers
  - ✅ View all teams and manage team members
  - ✅ Full access to all features

### 🟡 Manager Account
- **Email/Username:** `manager@example.com` or `manager`
- **Password:** `manager123`
- **Role:** Manager
- **Permissions:**
  - ✅ Create and assign tasks to users
  - ✅ View and update tasks for their team
  - ✅ View their team members
  - ✅ Delete tasks they created or assigned to their team
  - ❌ Cannot manage user accounts
  - ❌ Cannot see tasks outside their team

### 🟢 User Account
- **Email/Username:** `user@example.com` or `user`
- **Password:** `user123`
- **Role:** User
- **Permissions:**
  - ✅ View tasks assigned to them
  - ✅ Update status of their assigned tasks (To Do, In Progress, Completed)
  - ✅ View calendar for their tasks
  - ❌ Cannot create, delete, or assign tasks
  - ❌ Cannot edit task details (only status)
  - ❌ Cannot see other users' tasks
