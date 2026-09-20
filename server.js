// server.js - Kiln & Thread Storefront Backend
// Provides Authentication, Summary Dashboard API, Customer Orders, and Fulfillment Tracking

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// In-Memory Data Store (matches schema.sql + seed.sql + 002_auth)
// Seamless fallback for local run without requiring live PostgreSQL
// -------------------------------------------------------------
const dbState = {
  makers: [
    { id: 1, name: 'Alder Clayworks', slug: 'alder-clayworks', bio: 'A small stoneware studio throwing tableware in batches of a dozen at a time.', location: 'Asheville, NC' },
    { id: 2, name: 'Fen & Reed', slug: 'fen-and-reed', bio: 'Willow basketry using reeds coppiced from a family plot.', location: 'Somerset, UK' },
    { id: 3, name: 'Norra Textiles', slug: 'norra-textiles', bio: 'Floor-loom weaving in undyed, natural-fibre wool and cotton.', location: 'Portland, OR' },
    { id: 4, name: 'Birch & Saw', slug: 'birch-and-saw', bio: 'End-grain and live-edge woodworking, finished with food-safe oils.', location: 'Burlington, VT' },
    { id: 5, name: 'Hollow Hive', slug: 'hollow-hive', bio: 'Small-batch beeswax and soy candles poured by hand.', location: 'Austin, TX' },
    { id: 6, name: 'Marrow Leather Co.', slug: 'marrow-leather-co', bio: 'Waxed canvas and full-grain leather goods made to age well.', location: 'Minneapolis, MN' }
  ],
  categories: [
    { id: 1, name: 'Ceramics', slug: 'ceramics' },
    { id: 2, name: 'Woven', slug: 'woven' },
    { id: 3, name: 'Woodwork', slug: 'woodwork' },
    { id: 4, name: 'Candles', slug: 'candles' },
    { id: 5, name: 'Leather', slug: 'leather' }
  ],
  products: [
    { id: 1, slug: 'speckled-stoneware-bowl', name: 'Speckled Stoneware Bowl', maker_id: 1, category_id: 1, price_cents: 4800, material: 'Stoneware, food-safe glaze', description: 'Wheel-thrown from a flecked stoneware clay, finished with a matte oat glaze. Microwave and dishwasher safe.', maker_quote: 'Every bowl comes out a little different — the speckles are iron in the clay, not paint.', photo_url: 'https://images.unsplash.com/photo-1546938576-8219ca96ffb5?auto=format&fit=crop&w=800&q=80', stock_qty: 24, is_active: true },
    { id: 2, slug: 'terracotta-pour-over-mug', name: 'Terracotta Pour-Over Mug', maker_id: 1, category_id: 1, price_cents: 3200, material: 'Terracotta, lead-free glaze', description: 'A single-origin mug with a thumb rest and a glaze that darkens slightly with every use.', maker_quote: 'I make these in batches of twelve so no two months look quite the same.', photo_url: 'https://images.unsplash.com/photo-1628149588806-04e41a81a945?auto=format&fit=crop&w=800&q=80', stock_qty: 30, is_active: true },
    { id: 3, slug: 'river-stone-vase', name: 'River Stone Vase', maker_id: 1, category_id: 1, price_cents: 6400, material: 'Stoneware', description: 'A tall, narrow vase inspired by riverbed stones, hand-shaped without a wheel.', maker_quote: 'I press each one with my palms — you can still feel the shape of my hands in the base.', photo_url: 'https://images.unsplash.com/photo-1699662051194-3ad962273048?auto=format&fit=crop&w=800&q=80', stock_qty: 3, is_active: true }, // low stock
    { id: 4, slug: 'willow-market-basket', name: 'Willow Market Basket', maker_id: 2, category_id: 2, price_cents: 5600, material: 'Willow', description: 'Hand-woven willow basket with a fixed handle, sized for market runs or bread proofing.', maker_quote: 'The willow is coppiced from a family plot and dried for six months before weaving.', photo_url: 'https://images.unsplash.com/photo-1586975471851-06fbf8453bda?auto=format&fit=crop&w=800&q=80', stock_qty: 18, is_active: true },
    { id: 5, slug: 'undyed-wool-throw', name: 'Undyed Wool Throw', maker_id: 3, category_id: 2, price_cents: 11800, material: '100% undyed wool', description: 'A heavy wool throw woven on a floor loom, left undyed to show the natural fleece colour.', maker_quote: 'It takes about fourteen hours on the loom, start to finish.', photo_url: 'https://images.unsplash.com/photo-1731399211410-e3ffe1560310?auto=format&fit=crop&w=800&q=80', stock_qty: 2, is_active: true }, // low stock
    { id: 6, slug: 'cotton-macrame-hanging', name: 'Cotton Macrame Hanging', maker_id: 3, category_id: 2, price_cents: 7400, material: 'Cotton cord, driftwood dowel', description: 'A knotted wall hanging in undyed cotton cord, roughly 60cm wide.', maker_quote: 'Macrame is just knots repeated with patience — nothing more complicated than that.', photo_url: 'https://images.unsplash.com/photo-1619808799783-db68de98fbe0?auto=format&fit=crop&w=800&q=80', stock_qty: 15, is_active: true },
    { id: 7, slug: 'walnut-cutting-board', name: 'Walnut Cutting Board', maker_id: 4, category_id: 3, price_cents: 8600, material: 'Black walnut, beeswax finish', description: 'End-grain walnut board, finished with food-safe mineral oil and beeswax.', maker_quote: 'End-grain is kinder to your knives — the fibres close back up after every cut.', photo_url: 'https://images.unsplash.com/photo-1685022056255-523278bf43ec?auto=format&fit=crop&w=800&q=80', stock_qty: 20, is_active: true },
    { id: 8, slug: 'oak-serving-board', name: 'Oak Serving Board', maker_id: 4, category_id: 3, price_cents: 5200, material: 'White oak', description: 'A long oak board for cheese or bread, with a live edge on one side.', maker_quote: 'I leave one edge natural so you can still see the tree it came from.', photo_url: 'https://images.unsplash.com/photo-1685022056255-523278bf43ec?auto=format&fit=crop&w=800&q=80', stock_qty: 4, is_active: true }, // low stock
    { id: 9, slug: 'beeswax-taper-set', name: 'Beeswax Taper Set', maker_id: 5, category_id: 4, price_cents: 2600, material: 'Pure beeswax', description: 'A pair of hand-dipped beeswax tapers, slow-burning with a faint honey scent.', maker_quote: 'Beeswax burns almost twice as long as paraffin — and it doesn\'t smoke.', photo_url: 'https://images.unsplash.com/photo-1631624401804-9654cc83aabc?auto=format&fit=crop&w=800&q=80', stock_qty: 40, is_active: true },
    { id: 10, slug: 'cedar-clove-candle', name: 'Cedar & Clove Candle', maker_id: 5, category_id: 4, price_cents: 3400, material: 'Soy wax, stoneware vessel', description: 'Poured in small batches with soy wax and a cotton wick, in a reusable stoneware vessel.', maker_quote: 'I test every scent on my own mantelpiece before it goes in the shop.', photo_url: 'https://images.unsplash.com/photo-1631624401804-9654cc83aabc?auto=format&fit=crop&w=800&q=80', stock_qty: 35, is_active: true },
    { id: 11, slug: 'waxed-canvas-tote', name: 'Waxed Canvas Tote', maker_id: 6, category_id: 5, price_cents: 9200, material: 'Waxed canvas, leather', description: 'A waxed canvas tote with full-grain leather straps that darken with age.', maker_quote: 'Give it a year outdoors and the wax finish will look completely different — that\'s the idea.', photo_url: 'https://images.unsplash.com/photo-1766634001794-b3003f486954?auto=format&fit=crop&w=800&q=80', stock_qty: 14, is_active: true },
    { id: 12, slug: 'slate-dinner-plate-set', name: 'Slate Dinner Plate Set', maker_id: 1, category_id: 1, price_cents: 9600, material: 'Stoneware, slate glaze', description: 'A set of two hand-thrown dinner plates in a soft slate glaze.', maker_quote: 'I throw these on the slower wheel setting — it keeps the rims from warping.', photo_url: 'https://images.unsplash.com/photo-1587306768727-45977dc859cc?auto=format&fit=crop&w=800&q=80', stock_qty: 16, is_active: true }
  ],
  // Pre-seeded Admin account matching seed_admin.sql
  admins: [
    {
      id: 1,
      email: 'admin@kilnandthread.com',
      name: 'Store Admin',
      password_hash: '$2b$10$CQcVythC4PHyFZZD38mWLOrzi/pnoe6/UjLTGLawh53ZrHB0xIMhq' // 'changeme123'
    }
  ],
  // Pre-seeded Customers
  customers: [
    {
      id: 1,
      name: 'Clara Oswald',
      email: 'clara.oswald@example.com',
      password_hash: bcrypt.hashSync('customer123', 10),
      created_at: '2026-08-10T09:15:00Z'
    },
    {
      id: 2,
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      password_hash: bcrypt.hashSync('customer123', 10),
      created_at: '2026-08-25T14:30:00Z'
    },
    {
      id: 3,
      name: 'Marcus Vance',
      email: 'marcus.vance@example.com',
      password_hash: bcrypt.hashSync('customer123', 10),
      created_at: '2026-09-01T11:45:00Z'
    }
  ],
  // Orders with full tracking and status lifecycle
  orders: [
    {
      id: 1,
      order_number: 'KT-482913',
      customer_id: 1,
      status: 'shipped',
      subtotal_cents: 9600,
      shipping_cents: 800,
      total_cents: 10400,
      shipping_name: 'Clara Oswald',
      shipping_address: '742 Evergreen Terrace',
      shipping_city: 'Portland',
      shipping_state: 'OR',
      shipping_zip: '97201',
      shipping_country: 'USA',
      tracking_number: 'KT-TRK-984210',
      carrier: 'FedEx Express',
      estimated_delivery: '2026-09-17',
      created_at: '2026-09-11T14:20:00Z',
      items: [
        { id: 101, product_id: 1, product_name: 'Speckled Stoneware Bowl', unit_price_cents: 4800, quantity: 2, photo_url: 'https://images.unsplash.com/photo-1546938576-8219ca96ffb5?auto=format&fit=crop&w=800&q=80' }
      ],
      history: [
        { id: 1, status: 'paid', note: 'Payment confirmed via Stripe checkout.', changed_by: 'system', created_at: '2026-09-11T14:22:00Z' },
        { id: 2, status: 'processing', note: 'Order sent to Alder Clayworks for batch inspection & boxing.', changed_by: 'admin@kilnandthread.com', created_at: '2026-09-12T09:10:00Z' },
        { id: 3, status: 'shipped', note: 'Package dispatched via FedEx Express (tracking # KT-TRK-984210).', changed_by: 'admin@kilnandthread.com', created_at: '2026-09-13T11:30:00Z' }
      ]
    },
    {
      id: 2,
      order_number: 'KT-482914',
      customer_id: 1,
      status: 'delivered',
      subtotal_cents: 11800,
      shipping_cents: 0,
      total_cents: 11800,
      shipping_name: 'Clara Oswald',
      shipping_address: '742 Evergreen Terrace',
      shipping_city: 'Portland',
      shipping_state: 'OR',
      shipping_zip: '97201',
      shipping_country: 'USA',
      tracking_number: 'KT-TRK-771923',
      carrier: 'UPS Ground',
      estimated_delivery: '2026-09-08',
      created_at: '2026-09-02T10:14:00Z',
      items: [
        { id: 102, product_id: 5, product_name: 'Undyed Wool Throw', unit_price_cents: 11800, quantity: 1, photo_url: 'https://images.unsplash.com/photo-1731399211410-e3ffe1560310?auto=format&fit=crop&w=800&q=80' }
      ],
      history: [
        { id: 4, status: 'paid', note: 'Payment received.', changed_by: 'system', created_at: '2026-09-02T10:15:00Z' },
        { id: 5, status: 'processing', note: 'Packed at Norra Textiles studio.', changed_by: 'admin@kilnandthread.com', created_at: '2026-09-03T10:00:00Z' },
        { id: 6, status: 'shipped', note: 'Carrier pickup complete.', changed_by: 'admin@kilnandthread.com', created_at: '2026-09-04T16:00:00Z' },
        { id: 7, status: 'out_for_delivery', note: 'Out for morning residential delivery.', changed_by: 'UPS', created_at: '2026-09-07T08:30:00Z' },
        { id: 8, status: 'delivered', note: 'Delivered to front porch. Signature verified.', changed_by: 'UPS', created_at: '2026-09-07T13:45:00Z' }
      ]
    },
    {
      id: 3,
      order_number: 'KT-482915',
      customer_id: 2,
      status: 'processing',
      subtotal_cents: 14200,
      shipping_cents: 1000,
      total_cents: 15200,
      shipping_name: 'Elena Rostova',
      shipping_address: '1204 Beacon St, Apt 4B',
      shipping_city: 'Boston',
      shipping_state: 'MA',
      shipping_zip: '02116',
      shipping_country: 'USA',
      tracking_number: null,
      carrier: null,
      estimated_delivery: '2026-09-20',
      created_at: '2026-09-13T16:45:00Z',
      items: [
        { id: 103, product_id: 4, product_name: 'Willow Market Basket', unit_price_cents: 5600, quantity: 1, photo_url: 'https://images.unsplash.com/photo-1586975471851-06fbf8453bda?auto=format&fit=crop&w=800&q=80' },
        { id: 104, product_id: 7, product_name: 'Walnut Cutting Board', unit_price_cents: 8600, quantity: 1, photo_url: 'https://images.unsplash.com/photo-1685022056255-523278bf43ec?auto=format&fit=crop&w=800&q=80' }
      ],
      history: [
        { id: 9, status: 'paid', note: 'Payment confirmed.', changed_by: 'system', created_at: '2026-09-13T16:46:00Z' },
        { id: 10, status: 'processing', note: 'Order awaiting courier dispatch booking.', changed_by: 'admin@kilnandthread.com', created_at: '2026-09-14T08:15:00Z' }
      ]
    },
    {
      id: 4,
      order_number: 'KT-482916',
      customer_id: 3,
      status: 'paid',
      subtotal_cents: 6000,
      shipping_cents: 500,
      total_cents: 6500,
      shipping_name: 'Marcus Vance',
      shipping_address: '55 Pine Ridge Way',
      shipping_city: 'Austin',
      shipping_state: 'TX',
      shipping_zip: '78701',
      shipping_country: 'USA',
      tracking_number: null,
      carrier: null,
      estimated_delivery: '2026-09-22',
      created_at: '2026-09-14T09:30:00Z',
      items: [
        { id: 105, product_id: 9, product_name: 'Beeswax Taper Set', unit_price_cents: 2600, quantity: 1, photo_url: 'https://images.unsplash.com/photo-1631624401804-9654cc83aabc?auto=format&fit=crop&w=800&q=80' },
        { id: 106, product_id: 10, product_name: 'Cedar & Clove Candle', unit_price_cents: 3400, quantity: 1, photo_url: 'https://images.unsplash.com/photo-1631624401804-9654cc83aabc?auto=format&fit=crop&w=800&q=80' }
      ],
      history: [
        { id: 11, status: 'paid', note: 'Order placed by customer and payment captured.', changed_by: 'system', created_at: '2026-09-14T09:31:00Z' }
      ]
    }
  ]
};

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// 1. Admin Login
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const admin = dbState.admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
  }

  const passwordMatch = bcrypt.compareSync(password, admin.password_hash);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
  }

  return res.json({
    success: true,
    message: 'Admin authentication successful.',
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: 'admin'
    },
    token: 'admin-sess-' + Date.now()
  });
});

// 2. Customer Login
app.post('/api/auth/customer/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const customer = dbState.customers.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
  if (!customer) {
    return res.status(401).json({ success: false, message: 'No customer account found with that email.' });
  }

  const match = bcrypt.compareSync(password, customer.password_hash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Incorrect password. Please check your credentials.' });
  }

  return res.json({
    success: true,
    message: 'Welcome back!',
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'customer'
    },
    token: 'cust-sess-' + Date.now()
  });
});

// 3. Customer Registration
app.post('/api/auth/customer/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
  }

  const existing = dbState.customers.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account already exists with this email address.' });
  }

  const newCustomer = {
    id: dbState.customers.length + 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password_hash: bcrypt.hashSync(password, 10),
    created_at: new Date().toISOString()
  };

  dbState.customers.push(newCustomer);

  return res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    user: {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      role: 'customer'
    },
    token: 'cust-sess-' + Date.now()
  });
});

// -------------------------------------------------------------
// Admin Summary Dashboard APIs
// -------------------------------------------------------------

app.get('/api/admin/summary', (req, res) => {
  // Compute Key Metrics
  const nonExpiredOrders = dbState.orders.filter(o => o.status !== 'expired' && o.status !== 'cancelled');
  const totalRevenueCents = nonExpiredOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0);
  const totalOrders = dbState.orders.length;
  const activeProducts = dbState.products.filter(p => p.is_active);
  const totalCustomers = dbState.customers.length;

  // Order Status Distribution
  const statusCounts = {
    paid: 0,
    processing: 0,
    shipped: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  };
  dbState.orders.forEach(o => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  // Best Sellers (matches README query: units sold by product)
  const productUnitsMap = {};
  dbState.orders.forEach(order => {
    if (order.status !== 'cancelled' && order.status !== 'expired') {
      order.items.forEach(item => {
        productUnitsMap[item.product_name] = (productUnitsMap[item.product_name] || 0) + item.quantity;
      });
    }
  });
  const bestSellers = Object.entries(productUnitsMap)
    .map(([name, units_sold]) => {
      const prod = dbState.products.find(p => p.name === name);
      return {
        name,
        units_sold,
        price_usd: prod ? (prod.price_cents / 100).toFixed(2) : '0.00',
        photo_url: prod ? prod.photo_url : null
      };
    })
    .sort((a, b) => b.units_sold - a.units_sold);

  // Revenue by Maker (matches README query)
  const makerRevenueMap = {};
  dbState.orders.forEach(order => {
    if (order.status !== 'cancelled' && order.status !== 'expired') {
      order.items.forEach(item => {
        const prod = dbState.products.find(p => p.id === item.product_id);
        const maker = prod ? dbState.makers.find(m => m.id === prod.maker_id) : null;
        const makerName = maker ? maker.name : 'Independent Artisan';
        const revenue = (item.unit_price_cents * item.quantity) / 100;
        makerRevenueMap[makerName] = (makerRevenueMap[makerName] || 0) + revenue;
      });
    }
  });
  const revenueByMaker = Object.entries(makerRevenueMap)
    .map(([maker, revenue]) => ({ maker, revenue: revenue.toFixed(2) }))
    .sort((a, b) => b.revenue - a.revenue);

  // Low Stock Alert (< 5 items)
  const lowStock = dbState.products
    .filter(p => p.stock_qty < 5 && p.is_active)
    .map(p => ({
      id: p.id,
      name: p.name,
      stock_qty: p.stock_qty,
      price_usd: (p.price_cents / 100).toFixed(2),
      material: p.material
    }));

  return res.json({
    success: true,
    summary: {
      total_revenue_usd: (totalRevenueCents / 100).toFixed(2),
      total_orders: totalOrders,
      active_products_count: activeProducts.length,
      total_customers_count: totalCustomers,
      pending_fulfillment_count: statusCounts.paid + statusCounts.processing,
      in_transit_count: statusCounts.shipped + statusCounts.out_for_delivery,
      delivered_count: statusCounts.delivered,
      status_counts: statusCounts,
      best_sellers: bestSellers,
      revenue_by_maker: revenueByMaker,
      low_stock_products: lowStock
    }
  });
});

// Admin: Get all orders
app.get('/api/admin/orders', (req, res) => {
  const enrichedOrders = dbState.orders.map(order => {
    const cust = dbState.customers.find(c => c.id === order.customer_id);
    return {
      ...order,
      customer_name: cust ? cust.name : order.shipping_name,
      customer_email: cust ? cust.email : 'guest@example.com'
    };
  });
  return res.json({ success: true, orders: enrichedOrders });
});

// Admin: Update Order Status & Fulfillment Tracking
app.patch('/api/admin/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, carrier, tracking_number, note, admin_email } = req.body;

  const validStatuses = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status stage.' });
  }

  const order = dbState.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  order.status = status;
  if (carrier) order.carrier = carrier;
  if (tracking_number) order.tracking_number = tracking_number;
  if (status === 'delivered') {
    order.fulfilled_at = new Date().toISOString();
  }

  const newHistoryEntry = {
    id: (order.history ? order.history.length : 0) + 1,
    status: status,
    note: note || `Order status transitioned to ${status.replace('_', ' ')}.`,
    changed_by: admin_email || 'admin@kilnandthread.com',
    created_at: new Date().toISOString()
  };

  if (!order.history) order.history = [];
  order.history.push(newHistoryEntry);

  return res.json({
    success: true,
    message: `Order #${order.order_number} status updated to ${status}.`,
    order
  });
});

// -------------------------------------------------------------
// Customer Endpoints
// -------------------------------------------------------------

// Customer: Get My Orders
app.get('/api/customer/orders', (req, res) => {
  const customerEmail = req.query.email;
  if (!customerEmail) {
    return res.status(400).json({ success: false, message: 'Customer email parameter is required.' });
  }

  const cust = dbState.customers.find(c => c.email.toLowerCase() === customerEmail.trim().toLowerCase());
  if (!cust) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const customerOrders = dbState.orders
    .filter(o => o.customer_id === cust.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json({
    success: true,
    customer: { id: cust.id, name: cust.name, email: cust.email },
    orders: customerOrders
  });
});

// Customer: Place a test order from the boutique catalog
app.post('/api/customer/orders', (req, res) => {
  const { customer_email, product_id, quantity = 1 } = req.body;
  if (!customer_email || !product_id) {
    return res.status(400).json({ success: false, message: 'Customer email and product ID are required.' });
  }

  const cust = dbState.customers.find(c => c.email.toLowerCase() === customer_email.trim().toLowerCase());
  if (!cust) {
    return res.status(404).json({ success: false, message: 'Customer account not found.' });
  }

  const product = dbState.products.find(p => p.id === parseInt(product_id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  if (product.stock_qty < quantity) {
    return res.status(400).json({ success: false, message: 'Not enough stock available.' });
  }

  // Deduct stock
  product.stock_qty -= quantity;

  const orderNum = 'KT-' + Math.floor(100000 + Math.random() * 900000);
  const subtotal = product.price_cents * quantity;
  const shipping = subtotal > 10000 ? 0 : 700; // Free shipping over $100

  const newOrder = {
    id: dbState.orders.length + 1,
    order_number: orderNum,
    customer_id: cust.id,
    status: 'paid',
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    total_cents: subtotal + shipping,
    shipping_name: cust.name,
    shipping_address: '100 Studio Way',
    shipping_city: 'Craftsville',
    shipping_state: 'CA',
    shipping_zip: '94016',
    shipping_country: 'USA',
    tracking_number: null,
    carrier: null,
    estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    items: [
      {
        id: Math.floor(1000 + Math.random() * 9000),
        product_id: product.id,
        product_name: product.name,
        unit_price_cents: product.price_cents,
        quantity: parseInt(quantity),
        photo_url: product.photo_url
      }
    ],
    history: [
      {
        id: 1,
        status: 'paid',
        note: 'Order placed & payment verified.',
        changed_by: 'system',
        created_at: new Date().toISOString()
      }
    ]
  };

  dbState.orders.unshift(newOrder);

  return res.status(201).json({
    success: true,
    message: `Order #${newOrder.order_number} created successfully!`,
    order: newOrder
  });
});

// -------------------------------------------------------------
// Catalog Products Endpoint
// -------------------------------------------------------------
app.get('/api/products', (req, res) => {
  const enriched = dbState.products.map(p => {
    const maker = dbState.makers.find(m => m.id === p.maker_id);
    const category = dbState.categories.find(c => c.id === p.category_id);
    return {
      ...p,
      maker_name: maker ? maker.name : 'Artisan',
      maker_location: maker ? maker.location : '',
      category_name: category ? category.name : 'General',
      price_usd: (p.price_cents / 100).toFixed(2)
    };
  });
  return res.json({ success: true, products: enriched });
});

// Catch-all route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`Kiln & Thread Storefront running on http://localhost:${PORT}`);
  console.log(`- Portal Gateway:      http://localhost:${PORT}/index.html`);
  console.log(`- Admin Login:         http://localhost:${PORT}/admin-login.html`);
  console.log(`- Admin Dashboard:     http://localhost:${PORT}/admin-dashboard.html`);
  console.log(`- Customer Login:      http://localhost:${PORT}/customer-login.html`);
  console.log(`- Customer Dashboard:  http://localhost:${PORT}/customer-dashboard.html`);
  console.log(`=================================================\n`);
});
