import { NextRequest, NextResponse } from 'next/server';
import { readData, addItem, updateItem, deleteItem } from '@/lib/db-storage';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'manager';
  branch: 'laban' | 'tuwaiq' | 'both' | 'headquarters';
  permissions: {
    canViewRevenues: boolean;
    canEditRevenues: boolean;
    canViewExpenses: boolean;
    canEditExpenses: boolean;
    canViewBonus: boolean;
    canEditBonus: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canManageRequests: boolean;
    canCreateRequests: boolean;
    canApproveRequests: boolean;
    canManageProducts: boolean;
  };
  title?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Default permissions based on role
const defaultPermissions = {
  admin: {
    canViewRevenues: true,
    canEditRevenues: true,
    canViewExpenses: true,
    canEditExpenses: true,
    canViewBonus: true,
    canEditBonus: true,
    canViewReports: true,
    canManageUsers: true,
    canManageRequests: true,
    canCreateRequests: true,
    canApproveRequests: true,
    canManageProducts: true,
  },
  manager: {
    canViewRevenues: true,
    canEditRevenues: true,
    canViewExpenses: true,
    canEditExpenses: false,
    canViewBonus: true,
    canEditBonus: false,
    canViewReports: true,
    canManageUsers: false,
    canManageRequests: true,
    canCreateRequests: true,
    canApproveRequests: true,
    canManageProducts: true,
  },
  employee: {
    canViewRevenues: true,
    canEditRevenues: false,
    canViewExpenses: true,
    canEditExpenses: false,
    canViewBonus: false,
    canEditBonus: false,
    canViewReports: false,
    canManageUsers: false,
    canManageRequests: false,
    canCreateRequests: true,
    canApproveRequests: false,
    canManageProducts: false,
  }
};

// Verify admin token
function verifyAdminToken(request: NextRequest): boolean {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return false;
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

// GET all users or single user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    
    let users = readData('users') as User[];
    
    if (id) {
      const user = users.find(u => u.id === Number(id));
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }
    
    if (email) {
      const user = users.find(u => u.email === email);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }
    
    // Remove passwords from all users
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin permission
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.role || !body.branch) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if user already exists
    const users = readData('users') as User[];
    if (users.find(u => u.email === body.email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // Create new user with default permissions for role
    const newUser: User = {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role,
      branch: body.branch,
      permissions: body.permissions || defaultPermissions[body.role],
      title: body.title || '',
      phone: body.phone || '',
      avatar: body.avatar || '',
      isActive: body.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const savedUser = addItem('users', newUser);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = savedUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT update user (admin only)
export async function PUT(request: NextRequest) {
  try {
    // Verify admin permission
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const users = readData('users') as User[];
    const existingUser = users.find(u => u.id === body.id);
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // If password is being updated, hash it
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    } else {
      // Keep existing password if not updating
      body.password = existingUser.password;
    }
    
    // Update user
    const updatedUser = {
      ...existingUser,
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    const result = updateItem('users', body.id, updatedUser);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = result;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin permission
    if (!verifyAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const deleted = deleteItem('users', Number(id));
    
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}