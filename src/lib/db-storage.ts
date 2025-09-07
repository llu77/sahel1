import fs from 'fs';
import path from 'path';

// Database storage for local development
const DB_PATH = path.join(process.cwd(), 'data');
const REVENUES_FILE = path.join(DB_PATH, 'revenues.json');
const EXPENSES_FILE = path.join(DB_PATH, 'expenses.json');
const DAILY_CLOSINGS_FILE = path.join(DB_PATH, 'daily_closings.json');
const USERS_FILE = path.join(DB_PATH, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize files if they don't exist
const initFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
  }
};

initFile(REVENUES_FILE);
initFile(EXPENSES_FILE);
initFile(DAILY_CLOSINGS_FILE);
// Don't init users file as it already exists with data

// Read data from file
export const readData = (type: 'revenues' | 'expenses' | 'daily_closings' | 'users') => {
  try {
    const filePath = 
      type === 'revenues' ? REVENUES_FILE :
      type === 'expenses' ? EXPENSES_FILE :
      type === 'users' ? USERS_FILE :
      DAILY_CLOSINGS_FILE;
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${type}:`, error);
    return [];
  }
};

// Write data to file
export const writeData = (type: 'revenues' | 'expenses' | 'daily_closings' | 'users', data: any[]) => {
  try {
    const filePath = 
      type === 'revenues' ? REVENUES_FILE :
      type === 'expenses' ? EXPENSES_FILE :
      type === 'users' ? USERS_FILE :
      DAILY_CLOSINGS_FILE;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${type}:`, error);
    return false;
  }
};

// Add item to collection
export const addItem = (type: 'revenues' | 'expenses' | 'daily_closings', item: any) => {
  const data = readData(type);
  const newItem = {
    ...item,
    id: data.length > 0 ? Math.max(...data.map((d: any) => d.id || 0)) + 1 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  data.push(newItem);
  writeData(type, data);
  return newItem;
};

// Update item in collection
export const updateItem = (type: 'revenues' | 'expenses' | 'daily_closings', id: number, updates: any) => {
  const data = readData(type);
  const index = data.findIndex((item: any) => item.id === id);
  
  if (index === -1) return null;
  
  data[index] = {
    ...data[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  writeData(type, data);
  return data[index];
};

// Delete item from collection
export const deleteItem = (type: 'revenues' | 'expenses' | 'daily_closings', id: number) => {
  const data = readData(type);
  const filtered = data.filter((item: any) => item.id !== id);
  
  if (filtered.length === data.length) return false;
  
  writeData(type, filtered);
  return true;
};

// Get items by date
export const getItemsByDate = (type: 'revenues' | 'expenses', date: string) => {
  const data = readData(type);
  return data.filter((item: any) => item.date === date);
};