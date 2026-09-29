import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Check,
  X,
  UserCheck,
  Calendar,
  Phone,
  Building2,
  User,
  FileText,
  Clock,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { AuthUser, UserRole, VisitorRecord, VisitorFormInput } from './types';

const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Employee / Reception',
  visitor: 'Visitor',
  student: 'Student',
};

const DEMO_ACCOUNTS: Array<{
  role: UserRole;
  label: string;
  email: string;
  password: string;
  subtitle: string;
}> = [
  {
    role: 'employee',
    label: 'Employee (Reception)',
    email: 'employee@company.com',
    password: 'password123',
    subtitle: 'Priya Sharma · Front Desk Admin',
  },
  {
    role: 'visitor',
    label: 'Visitor Login',
    email: 'visitor@client.com',
    password: 'password123',
    subtitle: 'Vikramjit Sen · Apex Logistics',
  },
  {
    role: 'student',
    label: 'Student Login',
    email: 'student@college.edu',
    password: 'password123',
    subtitle: 'Ananya Chatterjee · B.Tech CS',
  },
];

const COMMON_PURPOSES = [
  'Business Meeting',
  'Interview / HR Round',
  'Internship / Academic Project',
  'Client Consultation',
  'Vendor / Delivery',
  'Industrial Visit / Campus Tour',
];

function formatDateTime(isoString: string): { datePart: string; timePart: string; isToday: boolean } {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const datePart = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return { datePart, timePart, isToday };
}

export default function App() {
  // --------------------------------------------------------------------------
  // Authentication State (Employee, Visitor, Student)
  // --------------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('visitor_app_user');
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [loginIdentifier, setLoginIdentifier] = useState('employee@company.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompanyOrCollege, setRegCompanyOrCollege] = useState('');
  const [regDesignation, setRegDesignation] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Visitor Records & Dashboard State
  // --------------------------------------------------------------------------
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loadingVisitors, setLoadingVisitors] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'today' | 'mine'>('all');
  const [activeSection, setActiveSection] = useState<'dashboard' | 'register' | 'records'>('dashboard');

  // --------------------------------------------------------------------------
  // Add / Edit Visitor Form State
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState<VisitorFormInput>({
    name: '',
    mobileNumber: '',
    companyOrCollege: '',
    personToMeet: '',
    purposeOfVisit: '',
    visitorCategory: 'Visitor',
  });
  const [editingVisitorId, setEditingVisitorId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [liveClock, setLiveClock] = useState<Date>(() => new Date());

  // Keep auto Date & Time clock ticking every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Pre-fill visitor/student details when user logs in as visitor or student
  useEffect(() => {
    if (!currentUser) return;
    if (!editingVisitorId) {
      if (currentUser.role === 'visitor' || currentUser.role === 'student') {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || currentUser.name,
          mobileNumber: prev.mobileNumber || currentUser.mobileNumber,
          companyOrCollege: prev.companyOrCollege || currentUser.companyOrCollege,
          visitorCategory: currentUser.role === 'student' ? 'Student' : 'Visitor',
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          visitorCategory: 'Visitor',
        }));
      }
    }
  }, [currentUser, editingVisitorId]);

  // Fetch visitors from REST API
  const fetchVisitors = async (search = searchQuery) => {
    setLoadingVisitors(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const response = await fetch(`/api/visitors?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load visitor records');
      const data = await response.json();
      setVisitors(data.visitors || []);
      setTodayCount(typeof data.todayCount === 'number' ? data.todayCount : 0);
      setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoadingVisitors(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchVisitors(searchQuery);
    }, 150);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // --------------------------------------------------------------------------
  // Authentication Handlers
  // --------------------------------------------------------------------------
  const handleSelectDemoAccount = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setAuthMode('login');
    setSelectedRole(demo.role);
    setLoginIdentifier(demo.email);
    setLoginPassword(demo.password);
    setAuthError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
          role: selectedRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Invalid login credentials.');
        return;
      }
      localStorage.setItem('visitor_app_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setFormData({
        name: data.user.role !== 'employee' ? data.user.name : '',
        mobileNumber: data.user.role !== 'employee' ? data.user.mobileNumber : '',
        companyOrCollege: data.user.role !== 'employee' ? data.user.companyOrCollege : '',
        personToMeet: '',
        purposeOfVisit: '',
        visitorCategory: data.user.role === 'student' ? 'Student' : 'Visitor',
      });
    } catch {
      setAuthError('Unable to reach server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          mobileNumber: regMobile,
          password: regPassword,
          role: selectedRole,
          companyOrCollege: regCompanyOrCollege,
          designationOrCourse: regDesignation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Registration failed.');
        return;
      }
      localStorage.setItem('visitor_app_user', JSON.stringify(data.user));
      setCurrentUser(data.user);
    } catch {
      setAuthError('Unable to reach server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('visitor_app_user');
    setCurrentUser(null);
    setEditingVisitorId(null);
    setFormFeedback(null);
  };

  // --------------------------------------------------------------------------
  // Visitor CRUD Handlers
  // --------------------------------------------------------------------------
  const resetForm = () => {
    setEditingVisitorId(null);
    if (currentUser && (currentUser.role === 'visitor' || currentUser.role === 'student')) {
      setFormData({
        name: currentUser.name,
        mobileNumber: currentUser.mobileNumber,
        companyOrCollege: currentUser.companyOrCollege,
        personToMeet: '',
        purposeOfVisit: '',
        visitorCategory: currentUser.role === 'student' ? 'Student' : 'Visitor',
      });
    } else {
      setFormData({
        name: '',
        mobileNumber: '',
        companyOrCollege: '',
        personToMeet: '',
        purposeOfVisit: '',
        visitorCategory: 'Visitor',
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (
      !formData.name.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.companyOrCollege.trim() ||
      !formData.personToMeet.trim() ||
      !formData.purposeOfVisit.trim()
    ) {
      setFormFeedback({
        type: 'error',
        message: 'Please complete all required visitor fields before submitting.',
      });
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingVisitorId) {
        const res = await fetch(`/api/visitors/${editingVisitorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormFeedback({ type: 'error', message: data.error || 'Failed to update visitor record.' });
          return;
        }
        setFormFeedback({ type: 'success', message: 'Visitor details updated in register.' });
        resetForm();
        await fetchVisitors(searchQuery);
      } else {
        const res = await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            createdByUserId: currentUser?.id || '',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormFeedback({ type: 'error', message: data.error || 'Failed to register visitor.' });
          return;
        }
        setFormFeedback({
          type: 'success',
          message: `Visitor "${data.visitor.name}" registered with automatic timestamp.`,
        });
        resetForm();
        await fetchVisitors(searchQuery);
      }
    } catch {
      setFormFeedback({ type: 'error', message: 'Network error while saving visitor entry.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleStartEdit = (visitor: VisitorRecord) => {
    setEditingVisitorId(visitor._id);
    setFormData({
      name: visitor.name,
      mobileNumber: visitor.mobileNumber,
      companyOrCollege: visitor.companyOrCollege,
      personToMeet: visitor.personToMeet,
      purposeOfVisit: visitor.purposeOfVisit,
      visitorCategory: visitor.visitorCategory || 'Visitor',
    });
    setFormFeedback(null);
    setActiveSection('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVisitor = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
      if (!res.ok) return;
      setConfirmDeleteId(null);
      if (editingVisitorId === id) {
        resetForm();
      }
      await fetchVisitors(searchQuery);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // --------------------------------------------------------------------------
  // Filtered Records & CSV Export
  // --------------------------------------------------------------------------
  const displayedVisitors = useMemo(() => {
    return visitors.filter((v) => {
      if (viewFilter === 'today') {
        return formatDateTime(v.dateTime).isToday;
      }
      if (viewFilter === 'mine' && currentUser) {
        return (
          v.createdByUserId === currentUser.id ||
          v.mobileNumber === currentUser.mobileNumber ||
          v.name.toLowerCase() === currentUser.name.toLowerCase()
        );
      }
      return true;
    });
  }, [visitors, viewFilter, currentUser]);

  const studentVisitorsCount = useMemo(
    () => visitors.filter((v) => v.visitorCategory === 'Student').length,
    [visitors]
  );

  const corporateVisitorsCount = useMemo(
    () => visitors.filter((v) => v.visitorCategory !== 'Student').length,
    [visitors]
  );

  const handleExportCSV = () => {
    if (displayedVisitors.length === 0) return;

    const headers = [
      'Visitor Name',
      'Mobile Number',
      'Category',
      'Company / College Name',
      'Person to Meet',
      'Purpose of Visit',
      'Date',
      'Time',
      'ISO Timestamp',
    ];

    const escapeCsvField = (field: string) => {
      const cleaned = String(field ?? '').replace(/"/g, '""');
      return `"${cleaned}"`;
    };

    const rows = displayedVisitors.map((v) => {
      const { datePart, timePart } = formatDateTime(v.dateTime);
      return [
        escapeCsvField(v.name),
        escapeCsvField(v.mobileNumber),
        escapeCsvField(v.visitorCategory || 'Visitor'),
        escapeCsvField(v.companyOrCollege),
        escapeCsvField(v.personToMeet),
        escapeCsvField(v.purposeOfVisit),
        escapeCsvField(datePart),
        escapeCsvField(timePart),
        escapeCsvField(v.dateTime),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `visitor_register_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // VIEW 1: Login & Registration Portal (Employee, Visitor, Student)
  // ==========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        {/* Top Bar Contract: 3 Zones */}
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="#top" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              VisitorDesk
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('employee');
                  setAuthMode('login');
                }}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                  selectedRole === 'employee' ? 'text-slate-900 underline underline-offset-8' : ''
                }`}
              >
                Employee Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('visitor');
                  setAuthMode('login');
                }}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                  selectedRole === 'visitor' ? 'text-slate-900 underline underline-offset-8' : ''
                }`}
              >
                Visitor Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student');
                  setAuthMode('login');
                }}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
                  selectedRole === 'student' ? 'text-slate-900 underline underline-offset-8' : ''
                }`}
              >
                Student Portal
              </button>
            </nav>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {authMode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Authentication Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: System Overview & Quick Role Demo Access */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500">
                MERN Stack Digital Reception & Access Management
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 max-w-2xl">
                Employee Visitor Registration System
              </h1>
              <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                Replace manual paper registers with a centralized digital visitor log. Reception staff,
                employees, corporate visitors, and college students can sign in to register visits, search
                records by name or mobile number, update details, and export daily registers to CSV.
              </p>
            </div>

            {/* Live Today's Snapshot Strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-500">Today&apos;s Registered Visitors</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {todayCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">Auto-logged date &amp; time entries</p>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-6">
                <p className="text-xs text-slate-500">Total Visitor Records</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {totalCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">Searchable by name or mobile</p>
              </div>
              <div className="sm:border-l sm:border-slate-200 sm:pl-6">
                <p className="text-xs text-slate-500">Supported Login Roles</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">3</p>
                <p className="mt-1 text-xs text-slate-500">Employee · Visitor · Student</p>
              </div>
            </div>

            {/* One-Click Demo Credentials for Testing All 3 Roles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Quick-Fill Demo Credentials (Click to Populate)
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  Password: password123
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_ACCOUNTS.map((demo) => {
                  const isSelected =
                    authMode === 'login' &&
                    selectedRole === demo.role &&
                    loginIdentifier === demo.email;
                  return (
                    <button
                      key={demo.role}
                      type="button"
                      onClick={() => handleSelectDemoAccount(demo)}
                      className={`text-left p-4 rounded-xl border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{demo.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-75" />
                      </div>
                      <p
                        className={`mt-1.5 text-xs truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {demo.subtitle}
                      </p>
                      <p
                        className={`mt-1 text-xs font-mono truncate ${
                          isSelected ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {demo.email}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Role-Based Login / Registration Card */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {authMode === 'login' ? 'Sign In to Portal' : 'Create Portal Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your role: Employee, Visitor, or Student
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    authMode === 'register'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Role Segmented Selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Account Role
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(['employee', 'visitor', 'student'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      setAuthError('');
                      const demo = DEMO_ACCOUNTS.find((d) => d.role === r);
                      if (authMode === 'login' && demo) {
                        setLoginIdentifier(demo.email);
                        setLoginPassword(demo.password);
                      }
                    }}
                    className={`py-2 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      selectedRole === r
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'employee' ? 'Employee' : r === 'visitor' ? 'Visitor' : 'Student'}
                  </button>
                ))}
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Email or Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="Enter email or 10-digit mobile"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {authLoading
                    ? 'Signing in...'
                    : `Sign In as ${ROLE_LABELS[selectedRole]}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {selectedRole === 'student'
                      ? 'College / University Name'
                      : selectedRole === 'employee'
                      ? 'Company / Branch Name'
                      : 'Company / Organization Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regCompanyOrCollege}
                    onChange={(e) => setRegCompanyOrCollege(e.target.value)}
                    placeholder={
                      selectedRole === 'student'
                        ? 'e.g. IIT Kharagpur / NIT Durgapur'
                        : 'e.g. TCS / Infosys / NexaCorp'
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {selectedRole === 'student'
                      ? 'Course & Year (Optional)'
                      : 'Department / Designation (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    placeholder={
                      selectedRole === 'student'
                        ? 'e.g. B.Tech CSE 4th Year'
                        : 'e.g. Receptionist / Software Engineer'
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {authLoading
                    ? 'Creating Account...'
                    : `Register as ${ROLE_LABELS[selectedRole]}`}
                </button>
              </form>
            )}
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Employee Visitor Registration System · Digital Front-Desk Register</span>
            <span>Role-Based Access: Employee · Visitor · Student</span>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: Authenticated Visitor Registration System Dashboard & Register
  // ==========================================================================
  const formattedLiveClock = formatDateTime(liveClock.toISOString());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 Nav Links) — Zone 3 (Actions) */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
          >
            VisitorDesk
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveSection('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === 'dashboard'
                  ? 'text-slate-900 underline underline-offset-8 font-semibold'
                  : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('register')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === 'register'
                  ? 'text-slate-900 underline underline-offset-8 font-semibold'
                  : ''
              }`}
            >
              {editingVisitorId ? 'Edit Visitor' : 'New Visitor'}
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('records')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === 'records'
                  ? 'text-slate-900 underline underline-offset-8 font-semibold'
                  : ''
              }`}
            >
              Visitor Records
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              Export CSV
            </button>
          </nav>

          {/* Zone 3: Primary actions (CSV Export + Logout) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={displayedVisitors.length === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (1440px desktop baseline, max-w-7xl) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Context Header Strip: Logged-in User & Role Details (Unboxed metadata with · separators) */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{currentUser.name}</span>
              <span aria-hidden="true">·</span>
              <span>Role: {ROLE_LABELS[currentUser.role]}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser.companyOrCollege}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{currentUser.mobileNumber}</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Reception &amp; Visitor Registration Desk
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchVisitors(searchQuery)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Log
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveSection('register');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Visitor
            </button>
          </div>
        </section>

        {/* Bonus Feature: Dashboard Showing Today's Total Visitors */}
        <section aria-label="Visitor Dashboard Summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Today&apos;s Total Visitors</span>
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {todayCount}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Active entries for {formattedLiveClock.datePart}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Visitor Records</span>
                <UserCheck className="w-4 h-4 text-slate-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {totalCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                All registered entries in database
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Corporate &amp; Guest Visitors</span>
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {corporateVisitorsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Clients, vendors &amp; business guests
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Student &amp; College Visitors</span>
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {studentVisitorsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Internships, interviews &amp; academic visits
              </p>
            </div>
          </div>
        </section>

        {/* Two-Column Core Workspace: Left (Add / Edit Visitor Form) + Right (Visitor Records Table & Search) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL: Add / Edit Visitor Registration Form */}
          <section
            id="visitor-form-panel"
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingVisitorId ? 'Edit Visitor Details' : 'Add a New Visitor'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingVisitorId
                    ? 'Modify existing visitor entry and save changes'
                    : 'Register visitor entry with automatic Date & Time'}
                </p>
              </div>
              {editingVisitorId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
            </div>

            {formFeedback && (
              <div
                className={`mb-4 p-3 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <span>{formFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setFormFeedback(null)}
                  className="shrink-0 opacity-70 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Visitor Category Selector (Visitor / Student / Employee Guest) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Entry Type
                  </label>
                  {(currentUser.role === 'visitor' || currentUser.role === 'student') && !editingVisitorId && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          name: currentUser.name,
                          mobileNumber: currentUser.mobileNumber,
                          companyOrCollege: currentUser.companyOrCollege,
                          visitorCategory: currentUser.role === 'student' ? 'Student' : 'Visitor',
                        }))
                      }
                      className="text-xs font-medium text-slate-600 underline hover:text-slate-900 cursor-pointer"
                    >
                      Use My Profile Details
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {(['Visitor', 'Student', 'Employee'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, visitorCategory: cat })}
                      className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        formData.visitorCategory === cat
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Visitor Name <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* 2. Mobile Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* 3. Company / College Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {formData.visitorCategory === 'Student'
                    ? 'College / University Name'
                    : 'Company / College Name'}{' '}
                  <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.companyOrCollege}
                    onChange={(e) => setFormData({ ...formData, companyOrCollege: e.target.value })}
                    placeholder={
                      formData.visitorCategory === 'Student'
                        ? 'Enter college or university name'
                        : 'Enter company or college name'
                    }
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* 4. Person to Meet */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Person to Meet <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.personToMeet}
                    onChange={(e) => setFormData({ ...formData, personToMeet: e.target.value })}
                    placeholder="e.g. Neha Kapoor (HR Manager)"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* 5. Purpose of Visit */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Purpose of Visit <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    required
                    value={formData.purposeOfVisit}
                    onChange={(e) => setFormData({ ...formData, purposeOfVisit: e.target.value })}
                    placeholder="State purpose of visit..."
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 resize-none"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COMMON_PURPOSES.map((purpose) => (
                    <button
                      key={purpose}
                      type="button"
                      onClick={() => setFormData({ ...formData, purposeOfVisit: purpose })}
                      className="px-2 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {purpose}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Date & Time (Auto) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Date &amp; Time (Auto)</span>
                </div>
                <span className="text-xs font-mono tabular-nums font-medium text-slate-900">
                  {formattedLiveClock.datePart} · {formattedLiveClock.timePart}
                </span>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {editingVisitorId ? (
                  <>
                    <Check className="w-4 h-4" />
                    {formSubmitting ? 'Updating Record...' : 'Update Visitor Details'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {formSubmitting ? 'Registering...' : 'Register Visitor Entry'}
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT PANEL: View All Visitor Records, Search by Name/Mobile, Edit, Delete, CSV Export */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Table Controls Bar */}
            <div className="p-5 border-b border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Visitor Register Records
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing <span className="font-mono tabular-nums font-semibold text-slate-800">{displayedVisitors.length}</span>{' '}
                    of <span className="font-mono tabular-nums">{totalCount}</span> recorded entries
                  </p>
                </div>

                {/* Interactive Filter Controls (Segmented Tabs) */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      viewFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Records ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewFilter('today')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      viewFilter === 'today'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Today ({todayCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewFilter('mine')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      viewFilter === 'mine'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    My Entries
                  </button>
                </div>
              </div>

              {/* Search Visitor by Name or Mobile Number + Export Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search visitor by name or mobile number..."
                    className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={displayedVisitors.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export List to CSV
                </button>
              </div>
            </div>

            {/* Visitor Records Data Grid */}
            {loadingVisitors ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-12 bg-slate-100 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : displayedVisitors.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  No matching visitor records found
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery
                    ? `No visitors matched "${searchQuery}". Try searching a different name or mobile number.`
                    : 'Use the "Add a New Visitor" form on the left to log the first visitor entry.'}
                </p>
                {(searchQuery || viewFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setViewFilter('all');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Reset Search &amp; Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Visitor &amp; Mobile</th>
                      <th className="py-3 px-4">Company / College</th>
                      <th className="py-3 px-4">Person to Meet &amp; Purpose</th>
                      <th className="py-3 px-4 text-right">Date &amp; Time</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {displayedVisitors.map((visitor) => {
                      const { datePart, timePart, isToday } = formatDateTime(visitor.dateTime);
                      const isEditingThis = editingVisitorId === visitor._id;
                      const isConfirmingDelete = confirmDeleteId === visitor._id;

                      return (
                        <tr
                          key={visitor._id}
                          className={`transition-colors ${
                            isEditingThis
                              ? 'bg-amber-50/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Visitor Name & Mobile Number */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-slate-900">
                              {visitor.name}
                            </div>
                            {/* Zero-Pill Metadata Discipline: Clean unboxed inline text with · separator */}
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-mono tabular-nums text-slate-700">
                                {visitor.mobileNumber}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{visitor.visitorCategory || 'Visitor'}</span>
                            </div>
                          </td>

                          {/* Company / College Name */}
                          <td className="py-3.5 px-4 align-top text-slate-800">
                            <div className="text-sm font-medium text-slate-800 max-w-[200px]">
                              {visitor.companyOrCollege}
                            </div>
                          </td>

                          {/* Person to Meet & Purpose of Visit */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="text-sm font-medium text-slate-900">
                              {visitor.personToMeet}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 max-w-xs">
                              {visitor.purposeOfVisit}
                            </div>
                          </td>

                          {/* Auto Date & Time (Tabular Numerals) */}
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="text-xs font-mono tabular-nums font-medium text-slate-900">
                              {datePart}
                            </div>
                            <div className="mt-0.5 text-xs font-mono tabular-nums text-slate-500">
                              {timePart}
                              {isToday ? ' · Today' : ''}
                            </div>
                          </td>

                          {/* Edit & Delete Actions */}
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            {isConfirmingDelete ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVisitor(visitor._id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(visitor)}
                                  title="Edit visitor details"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(visitor._id)}
                                  title="Delete visitor record"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Employee Visitor Registration System · MERN Stack Application</span>
          <span>Signed in as {currentUser.name} ({ROLE_LABELS[currentUser.role]})</span>
        </div>
      </footer>
    </div>
  );
}
