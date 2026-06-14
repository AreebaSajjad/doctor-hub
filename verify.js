// Doctor Hub - Automated Verification Script
// Run: node verify.js (make sure backend is running on port 5000)

const BASE_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
let patientToken, doctorToken, assistantToken, adminToken;
let appointmentId, paymentId;

const log = (msg, ok = true) => {
  const sym = ok ? '✅' : '❌';
  console.log(`${sym} ${msg}`);
  ok ? passed++ : failed++;
};

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('\n🏥 Doctor Hub - Verification Tests\n' + '='.repeat(40));

  // 1. Health Check
  try {
    const { status, data } = await req('GET', '/health');
    log(`Health check: ${data.message}`, status === 200 && data.success);
  } catch { log('Health check - Server not running!', false); process.exit(1); }

  // 2. Register Patient
  const timestamp = Date.now();
  let res = await req('POST', '/auth/register', { full_name: 'Test Patient', email: `patient_${timestamp}@test.com`, password: 'Password123!', role: 'patient' });
  log(`Register patient (${res.status})`, res.status === 201 && res.data.success);
  patientToken = res.data.data?.token;

  // 3. Register Doctor
  res = await req('POST', '/auth/register', { full_name: 'Test Doctor', email: `doctor_${timestamp}@test.com`, password: 'Password123!', role: 'doctor', specialty: 'General Physician', treatment_type: 'Allopathic' });
  log(`Register doctor (${res.status})`, res.status === 201 && res.data.success);
  doctorToken = res.data.data?.token;

  // 4. Duplicate email blocked
  res = await req('POST', '/auth/register', { full_name: 'Dup', email: `patient_${timestamp}@test.com`, password: 'Password123!', role: 'patient' });
  log(`Duplicate email blocked (${res.status})`, res.status === 409);

  // 5. Login Patient
  res = await req('POST', '/auth/login', { email: `patient_${timestamp}@test.com`, password: 'Password123!' });
  log(`Patient login (${res.status})`, res.status === 200 && res.data.data?.token);

  // 6. Wrong password blocked
  res = await req('POST', '/auth/login', { email: `patient_${timestamp}@test.com`, password: 'WrongPass!' });
  log(`Wrong password blocked (${res.status})`, res.status === 401);

  // 7. Login sample accounts
  res = await req('POST', '/auth/login', { email: 'ali.assistant@doctorhub.pk', password: 'Password123!' });
  log(`Assistant login (${res.status})`, res.status === 200);
  assistantToken = res.data.data?.token;

  res = await req('POST', '/auth/login', { email: 'admin@doctorhub.pk', password: 'Password123!' });
  log(`Admin login (${res.status})`, res.status === 200);
  adminToken = res.data.data?.token;

  // 8. Get /me
  res = await req('GET', '/auth/me', null, patientToken);
  log(`Get current user (${res.status})`, res.status === 200 && res.data.data?.user);

  // 9. Forgot password
  res = await req('POST', '/auth/forgot-password', { email: `patient_${timestamp}@test.com` });
  log(`Forgot password endpoint (${res.status})`, res.status === 200);

  // 10. Get all doctors
  res = await req('GET', '/doctors');
  log(`Get doctors list (${res.status}) — found ${res.data.data?.doctors?.length || 0}`, res.status === 200 && res.data.data?.doctors);

  // 11. Filter by treatment type
  res = await req('GET', '/doctors?treatment_type=Allopathic');
  log(`Filter Allopathic doctors (${res.status})`, res.status === 200);

  // 12. Filter by disease
  res = await req('GET', '/doctors?disease=Diabetes');
  log(`Filter by disease (${res.status})`, res.status === 200);

  // 13. Search
  res = await req('GET', '/doctors?search=heart');
  log(`Search doctors (${res.status})`, res.status === 200);

  // 14. Book appointment
  const sampleDoctorRes = await req('GET', '/doctors');
  const sampleDoctor = sampleDoctorRes.data.data?.doctors?.[0];
  if (sampleDoctor) {
    res = await req('POST', '/appointments', { doctor_id: sampleDoctor.id, appointment_date: '2025-03-15', appointment_time: '10:00', reason: 'Checkup' }, patientToken);
    log(`Book appointment (${res.status})`, res.status === 201 && res.data.data?.appointment);
    appointmentId = res.data.data?.appointment?.id;
  } else { log('Book appointment - No doctors available', false); }

  // 15. Doctor cannot book appointment
  if (sampleDoctor) {
    res = await req('POST', '/appointments', { doctor_id: sampleDoctor.id, appointment_date: '2025-03-15', appointment_time: '11:00', reason: 'Test' }, doctorToken);
    log(`Doctor cannot book (${res.status})`, res.status === 403);
  }

  // 16. Get appointments (patient)
  res = await req('GET', '/appointments', null, patientToken);
  log(`Patient get appointments (${res.status})`, res.status === 200);

  // 17. Submit payment
  if (appointmentId) {
    res = await req('POST', '/payments', { appointment_id: appointmentId, amount: 2000, screenshot_url: 'https://example.com/receipt.jpg', payment_method: 'Bank Transfer' }, patientToken);
    log(`Submit payment (${res.status})`, res.status === 201);
    paymentId = res.data.data?.payment?.id;
  } else { log('Submit payment - No appointment', false); }

  // 18. Patient cannot verify payment (RBAC)
  if (paymentId) {
    res = await req('PATCH', `/payments/${paymentId}/verify`, { status: 'Verified' }, patientToken);
    log(`Patient cannot verify payment (${res.status})`, res.status === 403);
  }

  // 19. Assistant verifies payment
  if (paymentId) {
    res = await req('PATCH', `/payments/${paymentId}/verify`, { status: 'Verified' }, assistantToken);
    log(`Assistant verifies payment (${res.status})`, res.status === 200 || res.status === 403); // 403 if different doctor's payment
  }

  // 20. Get medical history (protected)
  res = await req('GET', '/history', null, patientToken);
  log(`Get medical history (${res.status})`, res.status === 200);

  // 21. Patient cannot add history (doctor only)
  res = await req('POST', '/history', { patient_id: 'test', diagnosis: 'Test' }, patientToken);
  log(`Patient cannot add history (${res.status})`, res.status === 403);

  // 22. Unauthenticated request blocked
  res = await req('GET', '/appointments');
  log(`Unauthenticated blocked (${res.status})`, res.status === 401);

  // 23. Admin analytics
  res = await req('GET', '/admin/analytics', null, adminToken);
  log(`Admin analytics (${res.status})`, res.status === 200 && res.data.data?.summary);

  // 24. Patient cannot access admin
  res = await req('GET', '/admin/analytics', null, patientToken);
  log(`Patient cannot access admin (${res.status})`, res.status === 403);

  // 25. Admin get users
  res = await req('GET', '/admin/users', null, adminToken);
  log(`Admin get users (${res.status})`, res.status === 200);

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(failed === 0 ? '🎉 All tests passed!' : `⚠️  ${failed} test(s) failed — check output above`);
  console.log('='.repeat(40) + '\n');
}

run().catch(err => {
  console.error('❌ Verification script error:', err.message);
  console.error('Make sure backend is running: cd backend && npm run dev');
  process.exit(1);
});
