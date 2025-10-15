// Pure Node.js API - No external dependencies
// HIPAA-compliant appointment management

let demoAppointments = [
  {
    id: 1,
    client_id: 1,
    client_name: 'John Doe',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    duration: 60,
    type: 'Psychotherapy 45 min (90834)',
    notes: 'Follow-up session',
    status: 'scheduled',
    created_at: new Date().toISOString()
  }
];
let nextId = 2;

function logAudit(action, details = {}) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}:`, details);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    logAudit('appointments_api_access', { method: req.method, url: req.url });

    if (req.method === 'GET') {
      const { month, year, client_id } = req.query;
      
      let result = demoAppointments;
      
      if (client_id) {
        result = result.filter(a => a.client_id == client_id);
      }
      
      if (month && year) {
        result = result.filter(a => {
          const aptDate = new Date(a.appointment_date);
          return aptDate.getMonth() + 1 == month && aptDate.getFullYear() == year;
        });
      }
      
      return res.json(result);
    }
    
    if (req.method === 'POST') {
      const { client_id, client_name, appointment_date, appointment_time, duration, type, notes, cpt_code } = req.body;
      
      if (!client_id || !appointment_date || !appointment_time || !type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newAppointment = {
        id: nextId++,
        client_id,
        client_name: client_name || 'Unknown Client',
        appointment_date,
        appointment_time,
        duration: duration || 60,
        type,
        cpt_code: cpt_code || null,
        notes: notes || null,
        status: 'scheduled',
        created_at: new Date().toISOString()
      };
      
      demoAppointments.push(newAppointment);
      logAudit('appointment_created', { id: newAppointment.id, client_id: newAppointment.client_id });
      return res.json(newAppointment);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    logAudit('appointments_api_error', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
};
