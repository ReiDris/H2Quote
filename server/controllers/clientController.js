const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getAllClients = async (req, res) => {
  try {
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

    const formattedClients = clients.map(company => {
      const primaryContact = company.users[0];
      const createdDate = new Date(company.created_at);
      const currentDate = new Date();
      const yearsAsCustomer = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24 * 365));

      return {
        client_id: `#CLIENT${company.company_id.toString().padStart(2, '0')}`,
        name: `${primaryContact.first_name} ${primaryContact.last_name}`.trim(),
        company: company.company_name,
        email: primaryContact.email || company.email,
        contact_number: primaryContact.phone || company.phone || '-',
        years_as_customer: yearsAsCustomer
      };
    });

    res.json({
      success: true,
      data: formattedClients
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients'
    });
  }
};

module.exports = {
  getAllClients
};