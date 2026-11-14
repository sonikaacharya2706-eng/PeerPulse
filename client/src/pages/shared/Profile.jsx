import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { User, Lock, Shield, Mail, Phone, Building, Award } from 'lucide-react';

const Profile = () => {
  const { user, updateUserProfile } = useAuthStore();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    year: user?.year || '',
    clubs: user?.clubs ? user?.clubs.join(', ') : '',
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profileData,
        year: profileData.year ? Number(profileData.year) : undefined,
        clubs: profileData.clubs
          ? profileData.clubs.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
      };
      const res = await api.put('/auth/profile', payload);
      updateUserProfile(res.data);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setSavingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success('Password changed successfully');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          User Profile & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account information and credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Badge */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg mb-4">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {user?.name}
          </h2>
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300 capitalize">
            {user?.role}
          </span>

          <div className="w-full mt-6 space-y-3 text-left border-t border-slate-100 dark:border-slate-700/60 pt-4 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            {user?.department && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Building className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Dept: {user?.department}</span>
              </div>
            )}
            {user?.rollNo && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Award className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Roll No: {user?.rollNo}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Shield className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Status: {user?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </Card>

        {/* Right: Forms */}
        <div className="space-y-6 md:col-span-2">
          {/* Profile details form */}
          <Card title="Personal Information" subtitle="Update your contact details">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profileData.department}
                    onChange={(e) =>
                      setProfileData({ ...profileData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {user?.role === 'student' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={profileData.year}
                      onChange={(e) =>
                        setProfileData({ ...profileData, year: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clubs & Societies (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profileData.clubs}
                    onChange={(e) =>
                      setProfileData({ ...profileData, clubs: e.target.value })
                    }
                    placeholder="e.g. Robotics Club, Coding Club, Music Society"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={savingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Change password form */}
          <Card title="Change Password" subtitle="Ensure your password has at least 8 characters">
            <form onSubmit={handlePassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passData.currentPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, currentPassword: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passData.newPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, newPassword: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passData.confirmPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, confirmPassword: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="secondary" loading={savingPass}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
