/* =====================================================
   DUMMY DATA – replace with Flask API responses
   ===================================================== */

export const dummyCategories = [
  { id: 1, name: 'Hot Beverages', description: 'Coffee, Tea, and more', itemCount: 8, createdAt: '2024-01-10' },
  { id: 2, name: 'Cold Beverages', description: 'Smoothies, Cold Coffee', itemCount: 6, createdAt: '2024-01-10' },
  { id: 3, name: 'Snacks', description: 'Light bites and finger food', itemCount: 12, createdAt: '2024-01-12' },
  { id: 4, name: 'Main Course', description: 'Full meals and plates', itemCount: 10, createdAt: '2024-01-12' },
  { id: 5, name: 'Desserts', description: 'Cakes, pastries, ice cream', itemCount: 9, createdAt: '2024-01-14' },
  { id: 6, name: 'Sandwiches', description: 'Freshly made sandwiches', itemCount: 7, createdAt: '2024-01-15' },
];

export const dummyProducts = [
  { id: 1, name: 'Espresso', category: 'Hot Beverages', categoryId: 1, price: 80, gstPercent: 5, description: 'Rich, bold espresso shot', available: true, image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=400' },
  { id: 2, name: 'Cappuccino', category: 'Hot Beverages', categoryId: 1, price: 120, gstPercent: 5, description: 'Creamy foam over espresso', available: true, image: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?w=400' },
  { id: 3, name: 'Latte', category: 'Hot Beverages', categoryId: 1, price: 130, gstPercent: 5, description: 'Smooth steamed milk with espresso', available: true, image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400' },
  { id: 4, name: 'Cold Brew', category: 'Cold Beverages', categoryId: 2, price: 150, gstPercent: 5, description: 'Slow-steeped cold coffee', available: true, image: 'https://images.pexels.com/photos/4264082/pexels-photo-4264082.jpeg?w=400' },
  { id: 5, name: 'Mango Smoothie', category: 'Cold Beverages', categoryId: 2, price: 160, gstPercent: 5, description: 'Fresh mango blended smoothie', available: true, image: 'https://images.pexels.com/photos/1346347/pexels-photo-1346347.jpeg?w=400' },
  { id: 6, name: 'Croissant', category: 'Snacks', categoryId: 3, price: 90, gstPercent: 12, description: 'Buttery flaky French pastry', available: true, image: 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?w=400' },
  { id: 7, name: 'Club Sandwich', category: 'Sandwiches', categoryId: 6, price: 180, gstPercent: 12, description: 'Classic triple-decker sandwich', available: true, image: 'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?w=400' },
  { id: 8, name: 'Pasta Alfredo', category: 'Main Course', categoryId: 4, price: 280, gstPercent: 12, description: 'Creamy white sauce pasta', available: false, image: 'https://images.pexels.com/photos/1527603/pexels-photo-1527603.jpeg?w=400' },
  { id: 9, name: 'Chocolate Cake', category: 'Desserts', categoryId: 5, price: 120, gstPercent: 12, description: 'Rich dark chocolate slice', available: true, image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?w=400' },
  { id: 10, name: 'Cheesecake', category: 'Desserts', categoryId: 5, price: 140, gstPercent: 12, description: 'New York style cheesecake', available: true, image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?w=400' },
  { id: 11, name: 'Masala Chai', category: 'Hot Beverages', categoryId: 1, price: 60, gstPercent: 5, description: 'Spiced Indian tea', available: true, image: 'https://images.pexels.com/photos/4110029/pexels-photo-4110029.jpeg?w=400' },
  { id: 12, name: 'Caesar Salad', category: 'Snacks', categoryId: 3, price: 220, gstPercent: 12, description: 'Classic Caesar with croutons', available: true, image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?w=400' },
];

export const dummyTables = [
  { id: 1, number: 'T01', capacity: 2, status: 'available', location: 'Indoor' },
  { id: 2, number: 'T02', capacity: 4, status: 'occupied', location: 'Indoor' },
  { id: 3, number: 'T03', capacity: 4, status: 'available', location: 'Indoor' },
  { id: 4, number: 'T04', capacity: 6, status: 'reserved', location: 'Indoor' },
  { id: 5, number: 'T05', capacity: 2, status: 'available', location: 'Outdoor' },
  { id: 6, number: 'T06', capacity: 4, status: 'occupied', location: 'Outdoor' },
  { id: 7, number: 'T07', capacity: 8, status: 'available', location: 'Outdoor' },
  { id: 8, number: 'T08', capacity: 2, status: 'available', location: 'Indoor' },
  { id: 9, number: 'T09', capacity: 4, status: 'reserved', location: 'Indoor' },
  { id: 10, number: 'T10', capacity: 6, status: 'occupied', location: 'Outdoor' },
];

export const dummyOrders = [
  { id: 101, billNo: 'BILL-001', type: 'Dine-In', table: 'T02', items: 3, amount: 480, status: 'completed', cashier: 'Riya Sharma', createdAt: '2025-07-01T10:30:00' },
  { id: 102, billNo: 'BILL-002', type: 'Takeaway', table: '-', items: 2, amount: 230, status: 'preparing', cashier: 'Amit Kumar', createdAt: '2025-07-01T11:00:00' },
  { id: 103, billNo: 'BILL-003', type: 'Dine-In', table: 'T06', items: 5, amount: 870, status: 'pending', cashier: 'Riya Sharma', createdAt: '2025-07-01T11:15:00' },
  { id: 104, billNo: 'BILL-004', type: 'Takeaway', table: '-', items: 1, amount: 120, status: 'completed', cashier: 'Amit Kumar', createdAt: '2025-07-01T09:45:00' },
  { id: 105, billNo: 'BILL-005', type: 'Dine-In', table: 'T10', items: 4, amount: 650, status: 'completed', cashier: 'Riya Sharma', createdAt: '2025-07-01T10:00:00' },
];

export const dummyEmployees = [
  { id: 1, name: 'Riya Sharma', email: 'riya@cafe.com', phone: '9876543210', role: 'Cashier', salary: 22000, joiningDate: '2023-06-01', status: 'active' },
  { id: 2, name: 'Amit Kumar', email: 'amit@cafe.com', phone: '9876543211', role: 'Cashier', salary: 22000, joiningDate: '2023-08-15', status: 'active' },
  { id: 3, name: 'Priya Patel', email: 'priya@cafe.com', phone: '9876543212', role: 'Chef', salary: 35000, joiningDate: '2023-01-10', status: 'active' },
  { id: 4, name: 'Rahul Singh', email: 'rahul@cafe.com', phone: '9876543213', role: 'Barista', salary: 20000, joiningDate: '2023-03-20', status: 'active' },
  { id: 5, name: 'Neha Verma', email: 'neha@cafe.com', phone: '9876543214', role: 'Manager', salary: 45000, joiningDate: '2022-11-05', status: 'active' },
  { id: 6, name: 'Suresh Reddy', email: 'suresh@cafe.com', phone: '9876543215', role: 'Waiter', salary: 18000, joiningDate: '2024-01-12', status: 'inactive' },
];

export const dummyDashboardStats = {
  todaySales: 12480,
  monthlySales: 284500,
  todayOrders: 47,
  totalMenuItems: 52,
  availableTables: 6,
  occupiedTables: 3,
  totalRevenue: 1245000,
  reservedTables: 1,
};

export const dummySalesChartData = [
  { day: 'Mon', sales: 8400, orders: 32 },
  { day: 'Tue', sales: 9200, orders: 38 },
  { day: 'Wed', sales: 7800, orders: 28 },
  { day: 'Thu', sales: 11200, orders: 45 },
  { day: 'Fri', sales: 14500, orders: 58 },
  { day: 'Sat', sales: 18900, orders: 74 },
  { day: 'Sun', sales: 16200, orders: 62 },
];

export const dummyMonthlyRevenue = [
  { month: 'Jan', revenue: 210000 },
  { month: 'Feb', revenue: 195000 },
  { month: 'Mar', revenue: 225000 },
  { month: 'Apr', revenue: 240000 },
  { month: 'May', revenue: 268000 },
  { month: 'Jun', revenue: 284500 },
  { month: 'Jul', revenue: 12480 },
];

export const dummyBestSelling = [
  { name: 'Cappuccino', quantity: 248, revenue: 29760 },
  { name: 'Club Sandwich', quantity: 186, revenue: 33480 },
  { name: 'Latte', quantity: 172, revenue: 22360 },
  { name: 'Chocolate Cake', quantity: 154, revenue: 18480 },
  { name: 'Cold Brew', quantity: 138, revenue: 20700 },
];

export const dummySettings = {
  cafeName: 'Brew & Bite Cafe',
  address: '123, MG Road, Bengaluru – 560001',
  gstNumber: '29AAABC1234D1Z5',
  phone: '+91 98765 43210',
  email: 'info@brewandbite.com',
  logo: '',
};

export const dummyBillHistory = [
  { id: 'BILL-001', date: '2025-07-01', cashier: 'Riya Sharma', table: 'T02', items: 3, subtotal: 430, gst: 50, discount: 0, total: 480, paymentMethod: 'Cash', status: 'paid' },
  { id: 'BILL-002', date: '2025-07-01', cashier: 'Amit Kumar', table: '-', items: 2, subtotal: 210, gst: 20, discount: 0, total: 230, paymentMethod: 'UPI', status: 'paid' },
  { id: 'BILL-003', date: '2025-06-30', cashier: 'Riya Sharma', table: 'T05', items: 4, subtotal: 590, gst: 80, discount: 50, total: 620, paymentMethod: 'Card', status: 'paid' },
  { id: 'BILL-004', date: '2025-06-30', cashier: 'Amit Kumar', table: 'T08', items: 6, subtotal: 820, gst: 100, discount: 0, total: 920, paymentMethod: 'Cash', status: 'paid' },
  { id: 'BILL-005', date: '2025-06-29', cashier: 'Neha Verma', table: 'T03', items: 2, subtotal: 240, gst: 25, discount: 0, total: 265, paymentMethod: 'UPI', status: 'paid' },
];
