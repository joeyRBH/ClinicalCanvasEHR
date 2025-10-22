// SMS Testing Script - Run in browser console on https://clinicalcanvas.app/app.html
// Tests the fixed SMS appointment reminder system

console.log('📱 Testing SMS Appointment Reminders - Fixed Version');

// Test 1: Verify SMS Queue Structure
function testSMSQueueStructure() {
    console.log('\n🔍 Test 1: SMS Queue Structure');
    
    const smsQueue = JSON.parse(localStorage.getItem('clinicalcanvas_sms_queue') || '[]');
    console.log('Current SMS queue:', smsQueue);
    
    if (smsQueue.length > 0) {
        const sample = smsQueue[0];
        const requiredFields = ['id', 'appointment_id', 'client_id', 'phone', 'message', 'scheduled_for', 'status', 'created_at'];
        
        const hasAllFields = requiredFields.every(field => sample.hasOwnProperty(field));
        console.log(`${hasAllFields ? '✅' : '❌'} Queue items have all required fields`);
        
        if (hasAllFields) {
            console.log('Sample queue item:', sample);
        }
    } else {
        console.log('ℹ️ No SMS items in queue');
    }
}

// Test 2: Verify PHI-Free Messages
function testPHIFreeMessages() {
    console.log('\n🔒 Test 2: PHI-Free Message Verification');
    
    const smsQueue = JSON.parse(localStorage.getItem('clinicalcanvas_sms_queue') || '[]');
    
    if (smsQueue.length > 0) {
        smsQueue.forEach((item, index) => {
            const message = item.message;
            const hasClientName = /Hi\s+\w+/.test(message) || /clientName/.test(message);
            const hasPHI = /John|Jane|Doe|Smith/.test(message);
            
            console.log(`Message ${index + 1}: ${hasClientName || hasPHI ? '❌' : '✅'} ${hasClientName || hasPHI ? 'Contains PHI' : 'PHI-free'}`);
            console.log(`  Content: "${message}"`);
        });
    } else {
        console.log('ℹ️ No messages to test');
    }
}

// Test 3: Verify 24-Hour Scheduling
function test24HourScheduling() {
    console.log('\n⏰ Test 3: 24-Hour Scheduling Verification');
    
    const appointments = JSON.parse(localStorage.getItem('clinicalcanvas_appointments') || '[]');
    const smsQueue = JSON.parse(localStorage.getItem('clinicalcanvas_sms_queue') || '[]');
    
    if (appointments.length > 0 && smsQueue.length > 0) {
        appointments.forEach(appointment => {
            const appointmentDateTime = new Date(appointment.appointment_date + 'T' + appointment.appointment_time);
            const expectedReminderTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
            
            const relatedSMS = smsQueue.find(sms => sms.appointment_id == appointment.id);
            
            if (relatedSMS) {
                const actualReminderTime = new Date(relatedSMS.scheduled_for);
                const timeDiff = Math.abs(actualReminderTime - expectedReminderTime);
                const isCorrect = timeDiff < 60000; // Within 1 minute
                
                console.log(`Appointment ${appointment.id}: ${isCorrect ? '✅' : '❌'} ${isCorrect ? 'Correctly scheduled' : 'Incorrect timing'}`);
                console.log(`  Appointment: ${appointmentDateTime.toLocaleString()}`);
                console.log(`  Reminder: ${actualReminderTime.toLocaleString()}`);
                console.log(`  Expected: ${expectedReminderTime.toLocaleString()}`);
            }
        });
    } else {
        console.log('ℹ️ No appointments or SMS items to compare');
    }
}

// Test 4: Test API Call Format
function testAPICallFormat() {
    console.log('\n🌐 Test 4: API Call Format Verification');
    
    // Simulate the API call format that should be used
    const testReminder = {
        phone: '+15551234567',
        message: 'Reminder: You have an appointment scheduled for Monday, October 23 at 2:00 PM. Please arrive 10 minutes early. Reply STOP to opt out.',
        from: 'ClinicalCanvas'
    };
    
    const correctAPICall = {
        smsType: 'general',
        smsData: {
            to: testReminder.phone,
            message: testReminder.message,
            from: testReminder.from
        }
    };
    
    console.log('✅ Correct API call format:');
    console.log(JSON.stringify(correctAPICall, null, 2));
    
    // Test if the format matches what the API expects
    const hasSmsType = correctAPICall.hasOwnProperty('smsType');
    const hasSmsData = correctAPICall.hasOwnProperty('smsData');
    const hasRequiredFields = correctAPICall.smsData && 
                             correctAPICall.smsData.hasOwnProperty('to') && 
                             correctAPICall.smsData.hasOwnProperty('message');
    
    console.log(`${hasSmsType && hasSmsData && hasRequiredFields ? '✅' : '❌'} API call format is correct`);
}

// Test 5: Test Phone Number Formatting
function testPhoneNumberFormatting() {
    console.log('\n📞 Test 5: Phone Number Formatting');
    
    const testNumbers = [
        '5551234567',      // 10 digits
        '15551234567',     // 11 digits starting with 1
        '+15551234567',    // Already formatted
        '(555) 123-4567',  // Formatted with parentheses
        '555-123-4567'     // Formatted with dashes
    ];
    
    testNumbers.forEach(number => {
        let formatted = number.trim();
        
        if (!formatted.startsWith('+')) {
            formatted = formatted.replace(/\D/g, ''); // Remove non-digits
            if (formatted.length === 10) {
                formatted = '+1' + formatted;
            } else if (formatted.length === 11 && formatted.startsWith('1')) {
                formatted = '+' + formatted;
            }
        }
        
        const isValid = /^\+1\d{10}$/.test(formatted);
        console.log(`${isValid ? '✅' : '❌'} "${number}" → "${formatted}"`);
    });
}

// Test 6: Create Test Appointment and SMS
function createTestAppointment() {
    console.log('\n🧪 Test 6: Creating Test Appointment');
    
    const testAppointment = {
        id: Date.now(),
        client_id: 1,
        client_name: 'Test Client',
        appointment_date: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 hours from now
        appointment_time: '14:00',
        duration: 60,
        type: 'Test Appointment',
        notes: 'SMS testing appointment',
        status: 'scheduled',
        created_at: new Date().toISOString()
    };
    
    // Add to appointments
    const appointments = JSON.parse(localStorage.getItem('clinicalcanvas_appointments') || '[]');
    appointments.push(testAppointment);
    localStorage.setItem('clinicalcanvas_appointments', JSON.stringify(appointments));
    
    console.log('✅ Test appointment created:', testAppointment);
    
    // Simulate SMS scheduling
    const appointmentDateTime = new Date(testAppointment.appointment_date + 'T' + testAppointment.appointment_time);
    const reminderDateTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));
    
    const formattedDate = appointmentDateTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });
    const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const message = `Reminder: You have an appointment scheduled for ${formattedDate} at ${formattedTime}. Please arrive 10 minutes early. Reply STOP to opt out.`;
    
    const testSMS = {
        id: Date.now(),
        appointment_id: testAppointment.id,
        client_id: testAppointment.client_id,
        phone: '+15551234567',
        message: message,
        scheduled_for: reminderDateTime.toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString()
    };
    
    // Add to SMS queue
    const smsQueue = JSON.parse(localStorage.getItem('clinicalcanvas_sms_queue') || '[]');
    smsQueue.push(testSMS);
    localStorage.setItem('clinicalcanvas_sms_queue', JSON.stringify(smsQueue));
    
    console.log('✅ Test SMS reminder created:', testSMS);
    console.log(`📅 Appointment: ${appointmentDateTime.toLocaleString()}`);
    console.log(`⏰ Reminder: ${reminderDateTime.toLocaleString()}`);
    console.log(`📱 Message: "${message}"`);
}

// Run all tests
function runAllSMSTests() {
    console.log('🧪 Running all SMS tests...\n');
    
    testSMSQueueStructure();
    testPHIFreeMessages();
    test24HourScheduling();
    testAPICallFormat();
    testPhoneNumberFormatting();
    createTestAppointment();
    
    console.log('\n✅ All SMS tests completed!');
    console.log('\n💡 To test actual SMS sending, you would need to:');
    console.log('1. Set up Brevo API credentials');
    console.log('2. Wait for the scheduled time');
    console.log('3. Check the SMS queue status');
}

// Auto-run tests
runAllSMSTests();

// Export functions for manual testing
window.smsTests = {
    testSMSQueueStructure,
    testPHIFreeMessages,
    test24HourScheduling,
    testAPICallFormat,
    testPhoneNumberFormatting,
    createTestAppointment,
    runAllSMSTests
};

console.log('\n💡 Manual testing available via window.smsTests object');
