const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAllClients = async (req, res) => {
  try {
    // Get all active companies with their primary contact and calculate years as customer
    const { data: clients, error } = await supabase
      .from('companies')
      .select(`
        company_id,
        company_name,
        phone,
        email,
        created_at,
        users!inner (
          user_id,
          first_name,
          last_name,
          email,
          phone,
          is_primary_contact
        )
      `)
      .eq('status', 'Active')
      .eq('users.is_primary_contact', true)
      .eq('users.user_type', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format the data to match frontend expectations
    const formattedClients = clients.map(company => {
      const primaryContact = company.users[0];
      const createdDate = new Date(company.created_at);
      const currentDate = new Date();
      const yearsAsCustomer = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24 * 365));
      
      // Calculate eligible discount based on years as customer
      let eligibleDiscount = null;
      if (yearsAsCustomer >= 4) {
        eligibleDiscount = 10;
      } else if (yearsAsCustomer >= 2) {
        eligibleDiscount = 5;
      }

      return {
        client_id: `#CLIENT${company.company_id.toString().padStart(2, '0')}`,
        name: `${primaryContact.first_name} ${primaryContact.last_name}`.trim(),
        company: company.company_name,
        email: primaryContact.email || company.email,
        contact_number: primaryContact.phone || company.phone || '-',
        years_as_customer: yearsAsCustomer,
        eligible_discount: eligibleDiscount
      };
    });

    res.json({
      success: true,
      data: formattedClients
    });

  } catch (error) {
    console.error('Get all clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
};

module.exports = {
  getAllClients
};