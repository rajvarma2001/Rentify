const mongoose = require('mongoose');
const Property = require('../models/Property');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const User = require('../models/User');

exports.getReports = async (req, res) => {
  try {
    const { landlordId } = req.query;
    if (!landlordId) {
      return res.status(400).json({ status: 'error', message: 'Landlord ID is required' });
    }

    const landlordObjId = new mongoose.Types.ObjectId(landlordId);

    // 1. Fetch landlord's properties
    const properties = await Property.find({ landlord: landlordObjId });
    const propertyIds = properties.map(p => p._id);

    // 2. Fetch payments & expenses associated with properties
    const payments = await Payment.find({ property: { $in: propertyIds } }).populate('property', 'name');
    const expenses = await Expense.find({ landlord: landlordObjId }).populate('property', 'name');

    // 3. Property Report Summary
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.assignedTenant).length;
    const vacantProperties = totalProperties - occupiedProperties;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

    // Property-wise financial details
    const propertyBreakdown = properties.map(prop => {
      const propPayments = payments.filter(p => p.property?._id.toString() === prop._id.toString() && p.status === 'paid');
      const propExpenses = expenses.filter(e => e.property?._id.toString() === prop._id.toString());
      
      const totalIncome = propPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalExpense = propExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      return {
        id: prop._id,
        name: prop.name,
        address: prop.address,
        isOccupied: !!prop.assignedTenant,
        income: totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense
      };
    });

    // 4. Rent Collection Report
    const totalPaidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const totalDueAmount = payments.filter(p => p.status === 'due').reduce((sum, p) => sum + p.amount, 0);
    const totalOverdueAmount = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = (totalPaidAmount + totalDueAmount + totalOverdueAmount) > 0 
      ? Math.round((totalPaidAmount / (totalPaidAmount + totalDueAmount + totalOverdueAmount)) * 100)
      : 0;

    // 5. Tenant Report (Users associated via active properties)
    const activeTenantIds = properties.map(p => p.assignedTenant).filter(Boolean);
    const activeTenantsCount = activeTenantIds.length;
    // Get all tenant users
    const allTenantsList = await User.find({ role: 'tenant' });
    const tenantStatuses = {
      Active: allTenantsList.filter(t => t.status === 'Active').length,
      Pending: allTenantsList.filter(t => t.status === 'Pending').length,
      Suspended: allTenantsList.filter(t => t.status === 'Suspended').length || 0,
      Total: allTenantsList.length
    };

    // 6. Monthly Financial Matrix (Last 6 Months grouping)
    // We group paid payments as income, and expenses as expenses
    const monthlyStats = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        income: 0,
        expense: 0
      };
    }

    // Populate monthly income
    payments.forEach(p => {
      if (p.status === 'paid' && p.paidAt) {
        const dateObj = new Date(p.paidAt);
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyStats[key]) {
          monthlyStats[key].income += p.amount;
        }
      }
    });

    // Populate monthly expenses
    expenses.forEach(e => {
      if (e.date) {
        const dateObj = new Date(e.date);
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyStats[key]) {
          monthlyStats[key].expense += e.amount;
        }
      }
    });

    // Format monthly data
    const financialReport = Object.keys(monthlyStats).map(key => {
      const inc = monthlyStats[key].income;
      const exp = monthlyStats[key].expense;
      return {
        month: monthlyStats[key].label,
        income: inc,
        expense: exp,
        profit: inc - exp
      };
    });

    res.json({
      status: 'success',
      reports: {
        financialReport,
        rentCollection: {
          paid: totalPaidAmount,
          due: totalDueAmount,
          overdue: totalOverdueAmount,
          rate: collectionRate
        },
        tenantStats: {
          activeCount: activeTenantsCount,
          statuses: tenantStatuses
        },
        propertyStats: {
          total: totalProperties,
          occupied: occupiedProperties,
          vacant: vacantProperties,
          rate: occupancyRate,
          breakdown: propertyBreakdown
        }
      }
    });

  } catch (err) {
    console.error('Fetch reports error:', err);
    res.status(500).json({ status: 'error', message: 'Error generating reports summary' });
  }
};
