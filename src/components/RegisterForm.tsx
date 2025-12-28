import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Regular User',
    department: '',
    phone: '',
    line_manager_id: ''
  });

  const [managers, setManagers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { signUp } = useAuth();

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('status', 'Active')
      .in('role', ['Manager', 'Super User'])
      .order('full_name');

    if (data) setManagers(data as any);
  };

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (pwd: string) => {
    setFormData({ ...formData, password: pwd });
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 4) {
      setError('Password must contain at least 8 characters, 1 uppercase, 1 number, and 1 special character');
      return;
    }

    if (!formData.line_manager_id) {
      setError('Please select a line manager');
      return;
    }

    setLoading(true);

    const result = await signUp(formData.email, formData.password, {
      full_name: formData.full_name,
      role: formData.role,
      department: formData.department,
      phone: formData.phone,
      line_manager_id: formData.line_manager_id
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to register');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="card w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-lcp-blue mb-2">Registration Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your account has been created and is pending approval from your line manager.
          You will receive an email once your account is approved.
        </p>
        <button onClick={onSwitchToLogin} className="btn-primary">
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-lcp-blue mb-2">Create Account</h1>
        <p className="text-gray-600">Join LightCastle Partners Project Management</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="input-field"
              required
            />
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded ${
                    passwordStrength >= level
                      ? passwordStrength === 4
                        ? 'bg-green-500'
                        : passwordStrength === 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Requested Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
              required
            >
              <option value="Regular User">Regular User</option>
              <option value="Project Lead">Project Lead</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="line_manager_id" className="block text-sm font-medium text-gray-700 mb-1">
              Line Manager <span className="text-red-500">*</span>
            </label>
            <select
              id="line_manager_id"
              value={formData.line_manager_id}
              onChange={(e) => setFormData({ ...formData, line_manager_id: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select a manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <span>Creating Account...</span>
          ) : (
            <>
              <UserPlus size={20} />
              <span>Register</span>
            </>
          )}
        </button>

        <div className="text-center mt-4">
          <span className="text-gray-600">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-lcp-blue font-medium hover:underline"
          >
            Sign in here
          </button>
        </div>
      </form>
    </div>
  );
}
