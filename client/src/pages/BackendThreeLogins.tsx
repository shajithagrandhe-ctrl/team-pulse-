import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Briefcase, Users, UserCheck, Shield, Eye, EyeOff, Mail, Lock, User as UserIcon, Phone, MapPin, Award, Zap, ArrowRight, CheckCircle, AlertCircle, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BackendThreeLogins = () => {
  const { login, register, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'employee' | 'admin' | 'customer'>('employee');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [animatedText, setAnimatedText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  // Employee specific fields
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");

  // Admin specific fields
  // Customer specific fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Animated text effect
  useEffect(() => {
    const texts = ["Welcome Back!", "Secure Login", "Quick Access"];
    let index = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    const typeWriter = () => {
      const currentText = texts[index];
      
      if (isDeleting) {
        setAnimatedText(currentText.substring(0, charIndex - 1));
        charIndex--;
        
        if (charIndex === 0) {
          isDeleting = false;
          index = (index + 1) % texts.length;
        }
      } else {
        setAnimatedText(currentText.substring(0, charIndex + 1));
        charIndex++;
        
        if (charIndex === currentText.length) {
          isDeleting = true;
          setTimeout(typeWriter, 2000);
          return;
        }
      }
      
      setTimeout(typeWriter, isDeleting ? 50 : 100);
    };
    
    typeWriter();
  }, []);

  const normalizeEmployeeId = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");

  const clearFieldError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailPattern.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!password) {
      newErrors.password = "Password is required";
    } else if (isLogin && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!isLogin && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!isLogin) {
      if (!displayName) {
        newErrors.displayName = "Display name is required";
      } else if (displayName.length < 2) {
        newErrors.displayName = "Name must be at least 2 characters";
      }

      if (activeTab === 'employee') {
        const empIdPattern = /^EMP\d{3}$/;
        const normalizedEmployeeId = normalizeEmployeeId(employeeId);
        if (!normalizedEmployeeId) {
          newErrors.employeeId = "Employee ID is required";
        } else if (!empIdPattern.test(normalizedEmployeeId)) {
          newErrors.employeeId = "Employee ID must be in format EMP001, EMP002, etc.";
        }
      }

      if (activeTab === 'customer') {
        const phonePattern = /^\\+91 \\d{10}$/;
        if (!phone) {
          newErrors.phone = "Phone number is required";
        } else if (!phonePattern.test(phone)) {
          newErrors.phone = "Phone must be in format +91 9876543210";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const roleMap = {
    employee: "EMPLOYEE",
    admin: "ADMIN",
    customer: "CUSTOMER"
  } as const;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      const expectedRole = roleMap[activeTab];

      if (loggedInUser.role !== expectedRole) {
        await logout();
        toast.error(`This account is for ${loggedInUser.role.toLowerCase()}, not ${activeTab}. Please select the correct role.`);
        return;
      }

      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} login successful!`);
      navigate(activeTab === "admin" ? "/admin" : "/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "admin") {
      toast.error("Admin accounts must be created by an administrator.");
      return;
    }

    if (activeTab === "customer") {
      toast.error("Customer credentials are created by admin/employee after purchase.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        email,
        password,
        displayName,
        fullName: displayName,
        role: "EMPLOYEE",
        department: activeTab === "employee" ? department : undefined,
        position: activeTab === "employee" ? position : undefined,
        employeeId: activeTab === "employee" ? employeeId : undefined,
        phoneNumber: undefined,
        address: undefined
      });

      toast.success(`${user.displayName} account created successfully!`);
      navigate("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isLogin ? handleLogin : handleSignup;

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'employee': return <Briefcase className="w-5 h-5" />;
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'customer': return <Users className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  const getTabColor = (tab: string) => {
    switch (tab) {
      case 'employee': return 'from-blue-500 to-blue-600';
      case 'admin': return 'from-purple-500 to-purple-600';
      case 'customer': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-64 h-64 bg-green-500 rounded-full opacity-10 blur-2xl top-1/2 left-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <img
                  src="/app-logo.png"
                  alt="EstateHub logo"
                  className="w-9 h-9 object-contain"
                  draggable={false}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">EstateHub</h1>
                <p className="text-blue-200 text-sm">Real Estate Management</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-white">
                {animatedText}
                <span className="animate-pulse">|</span>
              </h2>
              <p className="text-xl text-blue-200">
                Secure access to your real estate dashboard
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Choose Your Portal
                </CardTitle>
                <p className="text-blue-200">
                  Select your role to continue
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Login/Signup Toggle */}
                <div className="flex items-center justify-center p-1 bg-white/10 rounded-lg">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      isLogin 
                        ? 'bg-white text-gray-900' 
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </button>
                  <button
                    onClick={() => toast.info("Employee accounts are created by an administrator. Customer accounts are issued by your sales team.")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      !isLogin 
                        ? 'bg-white text-gray-900' 
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Account Access
                  </button>
                </div>

                {/* Role Selection Tabs */}
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
                    <TabsTrigger 
                      value="employee" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/80 border-white/20"
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Employee
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/80 border-white/20"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </TabsTrigger>
                    <TabsTrigger 
                      value="customer" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white text-white/80 border-white/20"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Customer
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="employee" className="space-y-4 mt-6">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getTabColor('employee')} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Employee Portal</h3>
                      <p className="text-blue-200 text-sm">Manage properties and customers</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4 mt-6">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getTabColor('admin')} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Admin Portal</h3>
                      <p className="text-blue-200 text-sm">System administration</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="customer" className="space-y-4 mt-6">
                    <div className="text-center mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getTabColor('customer')} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                        <Users className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Customer Portal</h3>
                      <p className="text-blue-200 text-sm">View your properties</p>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Login/Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && activeTab === "customer" && (
                    <p className="text-xs text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-md p-2">
                      Customer credentials are issued by admin/employee after property purchase.
                    </p>
                  )}
                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 ${errors.email ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 ${errors.password ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {errors.password && (
                        <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                      )}
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label className="text-white text-sm font-medium">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <Input
                          type="text"
                          placeholder="Enter your full name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className={`pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 ${errors.displayName ? 'border-red-500' : ''}`}
                          required
                        />
                        {errors.displayName && (
                          <p className="text-red-400 text-xs mt-1">{errors.displayName}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Role-specific fields */}
                  {activeTab === 'employee' && !isLogin && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-medium">Employee ID</Label>
                        <Input
                          placeholder="Enter employee ID (e.g., EMP001)"
                          value={employeeId}
                          onChange={(e) => {
                            setEmployeeId(e.target.value);
                            clearFieldError("employeeId");
                          }}
                          onBlur={(e) => {
                            const normalized = normalizeEmployeeId(e.target.value);
                            if (normalized) {
                              setEmployeeId(normalized);
                            }
                          }}
                          className={`bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 ${errors.employeeId ? 'border-red-500' : ''}`}
                        />
                        {errors.employeeId && (
                          <p className="text-red-400 text-xs mt-1">{errors.employeeId}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-white text-sm font-medium">Department</Label>
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="operations">Operations</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white text-sm font-medium">Position</Label>
                          <Select value={position} onValueChange={setPosition}>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="executive">Executive</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'customer' && !isLogin && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-medium">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                          <Input
                            placeholder="Enter phone number (+91 9876543210)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={`pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40 ${errors.phone ? 'border-red-500' : ''}`}
                          />
                          {errors.phone && (
                            <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white text-sm font-medium">Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                          <Input
                            placeholder="Enter your address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${getTabColor(activeTab)} text-white font-medium py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {getTabIcon(activeTab)}
                        {isLogin ? 'Sign in' : 'Sign up'} as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Quick Access */}
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-blue-200 text-sm mb-3">
                    {isLogin ? 'Admin Demo Access' : 'Default Accounts'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail("admin@estatehub.com");
                        setPassword("Admin123!");
                        setDisplayName("Super Administrator");
                        setActiveTab('admin');
                      }}
                      className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                    >
                      Super Admin
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail("manager@estatehub.com");
                        setPassword("Admin123!");
                        setDisplayName("Operations Manager");
                        setActiveTab('admin');
                      }}
                      className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white text-xs"
                    >
                      Operations Mgr
                    </Button>
                  </div>
                  <div className="flex gap-2 justify-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail("john.employee@estatehub.com");
                        setPassword("Emp123!");
                        setActiveTab('employee');
                      }}
                      className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      Employee Demo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail("customer1@estatehub.com");
                        setPassword("Cust123!");
                        setActiveTab('customer');
                      }}
                      className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      Customer Demo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendThreeLogins;
