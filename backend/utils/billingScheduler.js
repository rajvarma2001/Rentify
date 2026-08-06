const cron = require('node-cron');
const Lease = require('../models/Lease');
const Payment = require('../models/Payment');

const startBillingScheduler = () => {
  console.log('⏳ Automated Billing & Invoicing Scheduler Initialized.');

  // Run at 00:00 on the 1st day of every month
  cron.schedule('0 0 1 * *', async () => {
    console.log('📅 Running automated monthly billing invoice generator...');
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed

      // Boundaries for the current month
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Fetch all active or renewed leases
      const activeLeases = await Lease.find({ status: { $in: ['Active', 'Renewed'] } });
      console.log(`Found ${activeLeases.length} active/renewed leases to process.`);

      let createdCount = 0;
      for (const lease of activeLeases) {
        // Look for any payment invoice already generated for this tenant and property in the current month
        const existingPayment = await Payment.findOne({
          property: lease.property,
          tenant: lease.tenant,
          dueDate: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        });

        if (!existingPayment) {
          // Construct a new Payment record with 'due' status for the current rent amount
          const newPayment = new Payment({
            property: lease.property,
            tenant: lease.tenant,
            amount: lease.monthlyRent,
            status: 'due',
            dueDate: startOfMonth
          });

          await newPayment.save();
          createdCount++;
        }
      }
      console.log(`✅ Automated monthly billing completed. Invoices created: ${createdCount}`);
    } catch (err) {
      console.error('❌ Error executing automated monthly billing cron:', err);
    }
  });
};

module.exports = startBillingScheduler;
