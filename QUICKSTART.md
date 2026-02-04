# SnapClay POS - Quick Start Guide

A modern Point of Sale system for clay product businesses with inventory management, sales tracking, and payment handling.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Docker (optional)

## Quick Setup

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
git clone <your-repo>
cd clay-pos-system
docker-compose up -d
```

Access the app at `http://localhost:5173`

### Option 2: Manual Setup

1. **Backend Setup**

```bash
cd backend
npm install
# Set MongoDB connection in server.js
npm start  # Runs on port 5000
```

2. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

## First Steps

1. **Add Products**: Go to Inventory tab and add your clay products (colors, weights, prices)
2. **Make Sales**: Use Sales/POS tab to record transactions
3. **Track Payments**: Support for full payment, partial payment, or credit sales
4. **View Analytics**: Dashboard shows revenue, stock levels, and sales distribution

## Key Features

- **Inventory Management**: Add/edit/delete products with color coding
- **POS System**: Quick sales with cart functionality
- **Payment Tracking**: Handle paid, partial, and credit transactions
- **Visual Analytics**: Pie charts showing sales by color
- **Transaction History**: Filter by date and payment status
- **Factory Reset**: Clear all data when needed

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `GET /api/sales` - Get all transactions
- `POST /api/transactions` - Record new sale
- `POST /api/reset` - Reset all data

## Tech Stack

- **Frontend**: React, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, MongoDB
- **Deployment**: Docker Compose

## Troubleshooting

- **Port conflicts**: Change ports in docker-compose.yml
- **Database issues**: Check MongoDB connection string
- **Build errors**: Run `npm install` in both frontend and backend folders

## Support

For issues or questions, check the console logs or contact support.
